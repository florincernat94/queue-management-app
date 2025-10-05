import React, { useState } from 'react';
import { QrCode, Users, Clock, CheckCircle, Camera, Scan, Download } from 'lucide-react';

const QueueManager = () => {
  const [queues, setQueues] = useState([]);
  const [currentQueue, setCurrentQueue] = useState(null);
  const [qrData, setQrData] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInInput, setCheckInInput] = useState('');
  const [checkInQueue, setCheckInQueue] = useState(null);
  const [recentCheckIns, setRecentCheckIns] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    maxCapacity: 50,
    estimatedTime: 5
  });

  // Generate QR Code using QRCode.js via CDN
  const generateQRCodeSVG = (text) => {
    const size = 256;
    const qr = window.qrcodegen.QrCode.encodeText(text, window.qrcodegen.QrCode.Ecc.HIGH);
    const border = 2;
    const scale = size / (qr.size + border * 2);
    
    let parts = [];
    for (let y = 0; y < qr.size; y++) {
      for (let x = 0; x < qr.size; x++) {
        if (qr.getModule(x, y)) {
          const px = (x + border) * scale;
          const py = (y + border) * scale;
          parts.push(`M${px},${py}h${scale}v${scale}h-${scale}z`);
        }
      }
    }
    
    return (
      <svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`}
        style={{ maxWidth: '100%', height: 'auto' }}
      >
        <rect width={size} height={size} fill="white"/>
        <path d={parts.join('')} fill="black"/>
      </svg>
    );
  };

  const createQueue = () => {
    if (!formData.name || !formData.location) return;

    const newQueue = {
      id: Date.now().toString(),
      ...formData,
      currentNumber: 0,
      waitingCount: 0,
      servedToday: 0,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    setQueues([...queues, newQueue]);
    setFormData({ name: '', location: '', maxCapacity: 50, estimatedTime: 5 });
    setShowModal(false);
  };

  const generateQR = (queue) => {
    const qrContent = JSON.stringify({
      queueId: queue.id,
      queueName: queue.name,
      location: queue.location,
      timestamp: Date.now()
    });
    setQrData(qrContent);
    setCurrentQueue(queue);
  };

  const toggleQueueStatus = (id) => {
    setQueues(queues.map(q => 
      q.id === id ? { ...q, status: q.status === 'active' ? 'paused' : 'active' } : q
    ));
  };

  const incrementQueue = (id) => {
    setQueues(queues.map(q => 
      q.id === id ? { 
        ...q, 
        currentNumber: q.currentNumber + 1,
        servedToday: q.servedToday + 1 
      } : q
    ));
  };

  const openCheckIn = (queue) => {
    setCheckInQueue(queue);
    setShowCheckInModal(true);
    setCheckInInput('');
  };

  const processCheckIn = () => {
    try {
      const scannedData = JSON.parse(checkInInput);
      
      if (scannedData.type === 'checkin' && scannedData.queueId === checkInQueue.id) {
        const checkIn = {
          ticketId: scannedData.ticketId,
          queueNumber: scannedData.queueNumber,
          queueName: checkInQueue.name,
          timestamp: new Date().toISOString()
        };
        
        setRecentCheckIns([checkIn, ...recentCheckIns.slice(0, 9)]);
        
        setQueues(queues.map(q => 
          q.id === checkInQueue.id ? { 
            ...q, 
            currentNumber: q.currentNumber + 1,
            servedToday: q.servedToday + 1 
          } : q
        ));
        
        setCheckInInput('');
        alert(`✓ Check-in successful!\nTicket #${scannedData.queueNumber}`);
        setShowCheckInModal(false);
      } else {
        alert('Invalid QR code or wrong queue!');
      }
    } catch (e) {
      alert('Invalid QR code format. Please try again.');
    }
  };

  const downloadQRCode = () => {
    const svg = document.getElementById('queue-qr-svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    canvas.width = 512;
    canvas.height = 512;
    
    img.onload = () => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, 512, 512);
      
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `queue-${currentQueue.name}-${Date.now()}.png`;
        link.click();
        URL.revokeObjectURL(url);
      });
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Load QR Code library from CDN */}
      <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodegen/1.8.0/qrcodegen.min.js"></script>
      
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-3 rounded-xl">
                <QrCode className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Queue Manager</h1>
                <p className="text-gray-600">Generate QR codes & process check-ins</p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              <Users className="w-5 h-5" />
              New Queue
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Active Queues</h2>
            {queues.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No queues yet. Create one to get started!</p>
              </div>
            ) : (
              queues.map(queue => (
                <div key={queue.id} className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800">{queue.name}</h3>
                      <p className="text-sm text-gray-600">{queue.location}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      queue.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {queue.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Current</p>
                      <p className="text-2xl font-bold text-indigo-600">{queue.currentNumber}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Served</p>
                      <p className="text-2xl font-bold text-green-600">{queue.servedToday}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Wait</p>
                      <p className="text-2xl font-bold text-gray-700">{queue.estimatedTime}m</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => generateQR(queue)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <QrCode className="w-4 h-4" />
                      Queue QR
                    </button>
                    <button
                      onClick={() => openCheckIn(queue)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <Scan className="w-4 h-4" />
                      Check-in
                    </button>
                    <button
                      onClick={() => incrementQueue(queue.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
                    >
                      Next
                    </button>
                    <button
                      onClick={() => toggleQueueStatus(queue.id)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-lg font-medium transition-colors text-sm"
                    >
                      {queue.status === 'active' ? 'Pause' : 'Resume'}
                    </button>
                  </div>
                </div>
              ))
            )}

            {recentCheckIns.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-5">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Recent Check-ins
                </h3>
                <div className="space-y-2">
                  {recentCheckIns.slice(0, 5).map((checkIn, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">#{checkIn.queueNumber}</p>
                        <p className="text-xs text-gray-600">{checkIn.queueName}</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(checkIn.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Queue QR Code</h2>
            {currentQueue && window.qrcodegen ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-8 flex items-center justify-center">
                  <div id="queue-qr-svg" className="bg-white p-4 rounded-lg shadow-md">
                    {generateQRCodeSVG(qrData)}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <h3 className="font-bold text-gray-800">{currentQueue.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{currentQueue.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>~{currentQueue.estimatedTime} min wait</span>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                    <p className="text-xs text-blue-800">
                      <strong>Instructions:</strong> Customers scan this QR code with the Customer App to join the queue.
                    </p>
                  </div>
                </div>

                <button
                  onClick={downloadQRCode}
                  className="w-full bg-gray-800 hover:bg-gray-900 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download QR Code
                </button>
              </div>
            ) : currentQueue ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-3"></div>
                <p className="text-gray-500">Loading QR code library...</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <QrCode className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Select a queue to generate QR code</p>
              </div>
            )}
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Create New Queue</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Queue Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Customer Service"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="e.g., Main Branch - Counter 1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Capacity</label>
                    <input
                      type="number"
                      value={formData.maxCapacity}
                      onChange={(e) => setFormData({...formData, maxCapacity: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Est. Time (min)</label>
                    <input
                      type="number"
                      value={formData.estimatedTime}
                      onChange={(e) => setFormData({...formData, estimatedTime: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createQueue}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  Create Queue
                </button>
              </div>
            </div>
          </div>
        )}

        {showCheckInModal && checkInQueue && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Customer Check-in</h2>
              <p className="text-gray-600 mb-4">{checkInQueue.name}</p>
              
              <div className="bg-gray-100 rounded-xl p-8 mb-4 border-4 border-dashed border-gray-300">
                <Camera className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                <p className="text-center text-gray-600 text-sm">
                  Camera scanner would appear here in native app
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-600 mb-3">Or paste customer's check-in QR data:</p>
                <textarea
                  value={checkInInput}
                  onChange={(e) => setCheckInInput(e.target.value)}
                  placeholder='{"type":"checkin","ticketId":"T-123","queueId":"...","queueNumber":5}'
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent mb-4 font-mono text-sm"
                  rows="4"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowCheckInModal(false);
                      setCheckInInput('');
                    }}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={processCheckIn}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    Process Check-in
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mt-4">
                <p className="text-xs text-blue-800">
                  <strong>Demo:</strong> Copy the check-in QR data from the Customer App and paste it above.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueueManager;