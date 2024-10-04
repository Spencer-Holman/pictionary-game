import React, { useRef, useState, useEffect } from 'react';
import './Dashboard.css';

function Dashboard() {
  const [tool, setTool] = useState('Pencil');
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState([]); 
  const [currentStep, setCurrentStep] = useState(-1);
  const [guess, setGuess] = useState(''); // API guess result
  const [timeoutId, setTimeoutId] = useState(null); // To debounce API requests

  const selectTool = () => {
    setTool('Pencil');
  };

  const saveCanvasState = () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL(); 
    const newHistory = history.slice(0, currentStep + 1); 
    setHistory([...newHistory, dataUrl]); 
    setCurrentStep(newHistory.length); 
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    setLastPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveCanvasState(); 
  };

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
    ctx.strokeStyle = 'black'; 
    ctx.lineWidth = 2;
    ctx.stroke();

    setLastPosition(currentPosition);

    // Trigger the API guess as the user draws
    if (timeoutId) clearTimeout(timeoutId); // Cancel previous timeout if any

    const newTimeoutId = setTimeout(() => {
      triggerAPIGuess();
    }, 1500); // Wait for 1.5 seconds after drawing stops to trigger the API
    setTimeoutId(newTimeoutId);
  };

  const undo = () => {
    if (currentStep > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const previousState = new Image();
      previousState.src = history[currentStep - 1];
      previousState.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height); 
        ctx.drawImage(previousState, 0, 0); 
      };
      setCurrentStep(currentStep - 1);
    }
  };

  const redo = () => {
    if (currentStep < history.length - 1) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const nextState = new Image();
      nextState.src = history[currentStep + 1];
      nextState.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height); 
        ctx.drawImage(nextState, 0, 0); 
      };
      setCurrentStep(currentStep + 1); 
    }
  };

  // Set up canvas size once the component is mounted
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 600;
    canvas.height = 400;
  }, []);

// Automatically check with API after short inactivity while drawing
const triggerAPIGuess = async () => {
  const canvas = canvasRef.current;
  const imageBase64 = canvas.toDataURL('image/png'); // Get the drawing as a base64 string

  try {
    const googleVisionAPIUrl = `https://vision.googleapis.com/v1/images:annotate?key=${process.env.REACT_APP_GOOGLE_CLOUD_API_KEY}`;

    const response = await fetch(googleVisionAPIUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: imageBase64.replace(/^data:image\/\w+;base64,/, ''), // Clean base64 string
            },
            features: [
              {
                type: 'LABEL_DETECTION', // Use LABEL_DETECTION to analyze the whole image
                maxResults: 5, // Limit the number of labels (increase or decrease as necessary)
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();

    // Check if labelAnnotations exist to avoid errors
    if (data.responses[0].labelAnnotations) {
      // Sort the labels by confidence score and get the top one
      const topLabel = data.responses[0].labelAnnotations
        .sort((a, b) => b.score - a.score)[0].description;

      // Display the top label in the UI
      setGuess(`Detected: ${topLabel}`);
    } else {
      setGuess('No clear object detected. Try drawing more details.');
    }
  } catch (error) {
    console.error('Error analyzing image:', error);
    setGuess('Error analyzing image.');
  }
};


  return (
    <div className="dashboard">
      <h1>Pictionary Game Dashboard</h1>
      
      <canvas
        ref={canvasRef}
        className="drawing-area"
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseMove={draw}
        onMouseLeave={stopDrawing}
      ></canvas>
      
      <button onClick={selectTool} className="tool-button">
        Select Drawing Tool: {tool}
      </button>

      {/* Undo and Redo Buttons */}
      <div>
        <button onClick={undo} className="undo-button" disabled={currentStep <= 0}>
          Undo
        </button>
        <button onClick={redo} className="redo-button" disabled={currentStep >= history.length - 1}>
          Redo
        </button>
      </div>

      {/* Display the API guess */}
      {guess && <p>Guess: {guess}</p>}
    </div>
  );
}

export default Dashboard;
