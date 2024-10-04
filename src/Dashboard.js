import React, { useRef, useState, useEffect } from 'react';
import './Dashboard.css';

function Dashboard() {
  const [tool, setTool] = useState('Pencil'); // Keep track of selected tool (Pencil or Eraser)
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState([]); 
  const [currentStep, setCurrentStep] = useState(-1);
  const [guess, setGuess] = useState(''); // API guess result
  const [timeoutId, setTimeoutId] = useState(null); // To debounce API requests

  // Modify selectTool to allow selecting either Pencil or Eraser
  const selectTool = (selectedTool) => {
    setTool(selectedTool);
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

    // Adjust strokeStyle and lineWidth based on selected tool
    if (tool === 'Pencil') {
      ctx.strokeStyle = 'black'; // Pencil color
      ctx.lineWidth = 2; // Pencil thickness
    } else if (tool === 'Eraser') {
      ctx.strokeStyle = 'white'; // Eraser color (white background)
      ctx.lineWidth = 10; // Eraser thickness (you can adjust this)
    }

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
    // Clear the entire canvas
    const clearCanvas = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the entire canvas
      setHistory([]); // Reset the history
      setCurrentStep(-1); // Reset the step count
      setGuess(''); // Clear the guess result
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
    <div>
      <h1>Pictionary Game Dashboard</h1>
      <canvas 
        ref={canvasRef} 
        onMouseDown={startDrawing} 
        onMouseUp={stopDrawing} 
        onMouseMove={draw} 
        width={600} 
        height={400} 
        style={{ border: '1px solid black' }} 
      />
      <div>
      <button onClick={() => selectTool('Pencil')}>
          <span className="material-icons">create</span>
        </button>
        <button onClick={() => selectTool('Eraser')}>
          <span className="material-symbols-outlined">ink_eraser</span>
        </button>
        <button onClick={undo} disabled={currentStep <= 0}>
          <span className="material-icons">undo</span>
        </button>
        <button onClick={redo} disabled={currentStep >= history.length - 1}>
          <span className="material-icons">redo</span>
        </button>
        <button onClick={clearCanvas}>
          <span className="material-icons">delete</span>
        </button>
      </div>
      <p>Guess: {guess}</p>
    </div>
  );
}
export default Dashboard;
