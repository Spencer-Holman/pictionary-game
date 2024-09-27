import React, { useState } from 'react';
import './Dashboard.css'; // We'll add some basic styling here



function Dashboard() {
  const [tool, setTool] = useState('None');

  const selectTool = () => {
    setTool('Pencil');
  };

  return (
    <div className="dashboard">
      <h1>Pictionary Game Dashboard</h1>
      <div className="drawing-area">
        <p>Drawing Area</p>
      </div>
      <button onClick={selectTool} className="tool-button">
        Select Drawing Tool: {tool}
      </button>
    </div>
  );
}

export default Dashboard;
