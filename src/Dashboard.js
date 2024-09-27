import React, { useRef, useState, useEffect } from 'react';
import './Dashboard.css';

function Dashboard() {
  const [tool, setTool] = useState('Pencil');
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });

  // Select the drawing tool (you can add more tools later)
  const selectTool = () => {
    setTool('Pencil'); // We'll expand this later
  };

  // Start drawing when the mouse is pressed down
  const startDrawing = (e) => {
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    setLastPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  // Stop drawing when the mouse is released
  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // Draw on the canvas
  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Get the current mouse position
    const currentPosition = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    // Draw a line from the last position to the current position
    ctx.beginPath();
    ctx.moveTo(lastPosition.x, lastPosition.y);
    ctx.lineTo(currentPosition.x, currentPosition.y);
    ctx.strokeStyle = 'black'; // You can change the color based on tool selection
    ctx.lineWidth = 2;
    ctx.stroke();

    // Update the last position
    setLastPosition(currentPosition);
  };

  // Set up canvas size once the component is mounted
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 600;
    canvas.height = 400;
  }, []);

  return (
    <div className="dashboard">
      <h1>Pictionary Game Dashboard</h1>
      
      {/* Drawing Area (Canvas) */}
      <canvas
        ref={canvasRef}
        className="drawing-area"
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseMove={draw}
        onMouseLeave={stopDrawing} // Stop drawing if the mouse leaves the canvas
      ></canvas>
      
      {/* Tool Selection Button */}
      <button onClick={selectTool} className="tool-button">
        Select Drawing Tool: {tool}
      </button>
    </div>
  );
}

export default Dashboard;
