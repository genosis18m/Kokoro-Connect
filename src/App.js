import React, { useRef, useState, useEffect, useCallback } from "react";
import {Edit2, Eraser, Minus, Triangle, Square, Circle, Upload } from "lucide-react";
import socketManager from "./socketManager";

const App = () => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#3B82F6");
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState("brush");
  const [shapes, setShapes] = useState([]);
  const [currentShape, setCurrentShape] = useState(null);
  const [backgroundImage, setBackgroundImage] = useState(null);

  useEffect(() => {
    redrawCanvas();
  }, [shapes, backgroundImage]);
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.8;
    redrawCanvas();
  }, []);
  const handleShapeAdded = useCallback((shape) => {
    setShapes((prevShapes) => [...prevShapes, shape]);
  }, []);

  const handleShapeUpdated = useCallback((updatedShape) => {
    setShapes((prevShapes) =>
      prevShapes.map((shape) =>
        shape.id === updatedShape.id ? updatedShape : shape
      )
    );
  }, []);

  const handleCanvasCleared = useCallback(() => {
    setShapes([]);
    setBackgroundImage(null);
  }, []);

  useEffect(() => {
    const connectToServer = async () => {
      await socketManager.connect("http://localhost:3001", "http://localhost:3004");

      // Add event listeners *after* connecting
      socketManager.on("shapeAdded", handleShapeAdded);
      socketManager.on("shapeUpdated", handleShapeUpdated);
      socketManager.on("canvasCleared", handleCanvasCleared);
  }

  connectToServer(); // Call the async function 

  return () => { 
      socketManager.disconnect();
      socketManager.off("shapeAdded", handleShapeAdded);
      socketManager.off("shapeUpdated", handleShapeUpdated);
      socketManager.off("canvasCleared", handleCanvasCleared);
  };
}, [handleShapeAdded, handleShapeUpdated, handleCanvasCleared]);
  const getMousePos = (canvas, e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const { x, y } = getMousePos(canvas, e);
    setIsDrawing(true);

    if (tool === "brush" || tool === "eraser") {
      const newShape = {
        id: Date.now(),
        tool,
        points: [{ x, y }],
        color: tool === "eraser" ? "#FFFFFF" : color,
        brushSize,
      };
      setShapes((prevShapes) => [...prevShapes, newShape]);
      socketManager.addShape(newShape);
    } else {
      setCurrentShape({
        id: Date.now(),
        tool,
        startPos: { x, y },
        endPos: { x, y },
        color,
        brushSize,
      });
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const { x, y } = getMousePos(canvas, e);

    if (tool === "brush" || tool === "eraser") {
      setShapes((prevShapes) => {
        const updatedShapes = [...prevShapes];
        const currentPath = updatedShapes[updatedShapes.length - 1];
        currentPath.points.push({ x, y });
        socketManager.updateShape(currentPath);
        return updatedShapes;
      });
    } else {
      setCurrentShape((prev) => {
        const updated = { ...prev, endPos: { x, y } };
        socketManager.updateShape(updated);
        return updated;
      });
    }
    redrawCanvas();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (currentShape) {
      setShapes((prevShapes) => [...prevShapes, currentShape]);
      socketManager.addShape(currentShape);
      setCurrentShape(null);
    }
  };

  const drawShape = (shape, context) => {
    const { tool, startPos, endPos, color, brushSize, points } = shape;
    context.beginPath();
    context.strokeStyle = color;
    context.lineWidth = brushSize;
    context.lineCap = "round";
    context.lineJoin = "round";

    switch (tool) {
      case "brush":
      case "eraser":
        points.forEach((point, index) => {
          if (index === 0) {
            context.moveTo(point.x, point.y);
          } else {
            context.lineTo(point.x, point.y);
          }
        });
        break;
      case "line":
        context.moveTo(startPos.x, startPos.y);
        context.lineTo(endPos.x, endPos.y);
        break;
      case "rectangle":
        context.rect(
          startPos.x,
          startPos.y,
          endPos.x - startPos.x,
          endPos.y - startPos.y
        );
        break;
      case "circle":
        const radius = Math.sqrt(
          Math.pow(endPos.x - startPos.x, 2) +
            Math.pow(endPos.y - startPos.y, 2)
        );
        context.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
        break;
      case "triangle":
        context.moveTo(startPos.x, startPos.y);
        context.lineTo(endPos.x, endPos.y);
        context.lineTo(startPos.x - (endPos.x - startPos.x), endPos.y);
        context.closePath();
        break;
      default:
        break;
    }
    context.stroke();
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    if (backgroundImage) {
      context.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    } else {
      context.fillStyle = "#FFFFFF";
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    shapes.forEach((shape) => drawShape(shape, context));

    if (currentShape) {
      drawShape(currentShape, context);
    }
  };

  const clearCanvas = () => {
    setShapes([]);
    setCurrentShape(null);
    setBackgroundImage(null); // Clear background image as well
    socketManager.clearCanvas();
    redrawCanvas();
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    const image = canvas.toDataURL("image/jpeg", 1.0); // Improved image quality
    const link = document.createElement("a");
    link.href = image;
    link.download = "asla.jpg";
    link.click();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setBackgroundImage(img);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const colorOptions = [
      "#FF1493", // Deep Pink
      "#00BFFF", // Deep Sky Blue
      "#32CD32", // Lime Green
      "#FFD700", // Gold
      "#FF4500", // Orange Red
      "#8A2BE2", // Blue Violet
      "#00FF7F", // Spring Green
      "#FF69B4", // Hot Pink
    ];


  const tools= [
    { name: "brush", icon: <Edit2 size={24} /> },
    { name: "eraser", icon: <Eraser size={24} /> },
    { name: "line", icon: <Minus size={24} /> },
    { name: "rectangle", icon: <Square size={24} /> },
    { name: "circle", icon: <Circle size={24} /> },
    { name: "triangle", icon: <Triangle size={24} /> },
  ];

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '1.5rem',
    minHeight: '200vh',
    background: 'linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)',
    backgroundSize: '400% 400%',
    animation: 'gradient 15s ease infinite',
  };

  const titleStyle = {
    fontSize: '2.25rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
    color: 'white',
    textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
  };

  const toolbarStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1.5rem',
    padding: '1rem',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  };
  return (
    <div style={containerStyle}>
      <style>
        {`
          @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}
      </style>
      <h1 style={titleStyle}>
        Kokoro Connect
      </h1>
      <div style={toolbarStyle}>

        <div style={toolbarStyle}>
        <div className="flex items-center space-x-2">
        <label style={{ 
    fontSize: '1rem', 
    fontWeight: 'bold',
    color: '#6A0DAD' // A vibrant purple color
  }}>
            Color:</label>
          <div className="flex space-x-1">
            {colorOptions.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full ${
                  color === c ? "ring-2 ring-offset-2 ring-gray-400" : ""
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        </div>
        <div className="flex items-center space-x-2">
        <label style={{ 
    fontSize: '1rem', 
    fontWeight: 'bold',
    color: '#6A0DAD' // A vibrant purple color
  }}>
            Tool:</label>
          <div className="flex space-x-1">
            {tools.map((t) => (
              <button
                key={t.name}
                onClick={() => setTool(t.name)}
                className={`p-2 rounded ${
                  tool === t.name ? "bg-gray-200" : ""
                }`}
              >
                {t.icon}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
  <label style={{ 
    fontSize: '1rem', 
    fontWeight: 'bold',
    color: '#6A0DAD' // A vibrant purple color
  }}>
    Brush Size:
  </label>
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <input
      type="range"
      min="1"
      max="40"
      value={brushSize}
      onChange={(e) => setBrushSize(parseInt(e.target.value))}
      className="brush-size-range"
    />
    <span style={{ 
      marginTop: '0.5rem', 
      fontSize: '0.875rem', 
      fontWeight: 'bold',
      color: '#00BFFF' // Deep Sky Blue
    }}>
      {brushSize}px
    </span>
  </div>
</div>
        <div className="flex items-center space-x-2">
        <label style={{ 
  fontSize: '1rem', 
  fontWeight: 'bold',
  color: '#6A0DAD'
}}>
  Upload Image:
</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
      </div>
      <canvas
        width="800"
        height="400"
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          backgroundColor: 'white',
        }}
      />
      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
        <button
          onClick={clearCanvas}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#EF4444',
            color: 'white',
            borderRadius: '0.25rem',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Clear Canvas
        </button>
        <button
          onClick={downloadCanvas}
          tyle={{
            padding: '0.5rem 1rem',
            backgroundColor: 'red',
            color: 'white',
            borderRadius: '5rem',
            border: 'white',
            cursor: 'pointer',
          }}
        >
          Download
        </button>
      </div>
    </div>
  );
};
export default App;