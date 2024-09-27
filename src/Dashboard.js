import React, { useRef, useState, useEffect } from 'react';
import './Dashboard.css';

function Dashboard() {
  const [tool, setTool] = useState('Pencil');
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState([]); // To store the drawing history
  const [redoStack, setRedoStack] = useState([]); // To store undone states for redo

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
    if (!isDrawing) return;
    
    setIsDrawing(false);

    // Save the current canvas state to history after each drawing action
    const canvas = canvasRef.current;
    const canvasData = canvas.toDataURL();
    setHistory([...history, canvasData]); // Add new canvas state to history
    setRedoStack([]); // Clear the redo stack when new drawing occurs
  };

  // Draw on the canvas
  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    const currentPosition = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    ctx.beginPath();
    ctx.moveTo(lastPosition.x, lastPosition.y);
    ctx.lineTo(currentPosition.x, currentPosition.y);
    ctx.strokeStyle = 'black'; // Set line color
    ctx.lineWidth = 2; // Set line width
    ctx.stroke();

    setLastPosition(currentPosition); // Update the last position
  };

  // Undo function: revert to the previous state
  const undo = () => {
    if (history.length === 0) return;

    const newHistory = [...history];
    const lastState = newHistory.pop(); // Remove the latest state
    setRedoStack([...redoStack, lastState]); // Save the undone state in redo stack
    setHistory(newHistory); // Update the history with the new version

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const previousState = newHistory[newHistory.length - 1]; // Get the previous state

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Repaint the previous state if it exists
    if (previousState) {
      const img = new Image();
      img.src = previousState;
      img.onload = () => ctx.drawImage(img, 0, 0);
    }
  };

  // Redo function: reapply the undone state
  const redo = () => {
    if (redoStack.length === 0) return;

    const newRedoStack = [...redoStack];
    const redoState = newRedoStack.pop(); // Get the last undone state
    setRedoStack(newRedoStack); // Update the redo stack

    setHistory([...history, redoState]); // Add the redone state back to history

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Repaint the redone state
    const img = new Image();
    img.src = redoState;
    img.onload = () => ctx.drawImage(img, 0, 0);
  };

  // Set up canvas size once the component is mounted
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white'; // Make sure the canvas starts with a white background
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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

      {/* Undo and Redo Buttons */}
      <div>
        <button onClick={undo} className="tool-button">Undo</button>
        <button onClick={redo} className="tool-button">Redo</button>
      </div>
    </div>
  );
}

export default Dashboard;