export const detectRoomType = (area, aspectRatio) => {
  if (area < 4) return 'bathroom';
  if (area < 10) return 'bathroom';
  if (area > 25 && aspectRatio > 1.3) return 'living';
  if (aspectRatio < 1.5 && area < 15) return 'bedroom';
  if (aspectRatio > 1.6) return 'living';
  if (area > 10 && area < 20) return 'dining';
  return 'room';
};

export const analyzeFloorPlan = async (imageElement) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const maxSize = 800;
      let width = imageElement.width;
      let height = imageElement.height;
      
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(imageElement, 0, 0, width, height);
      
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      const grayscale = new Uint8Array(width * height);
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        grayscale[i / 4] = gray;
      }
      
      const edges = detectEdges(grayscale, width, height);
      const lines = detectLines(edges, width, height);
      const rooms = detectRooms(lines, width, height);
      
      const scaleX = 12 / width;
      const scaleY = 10 / height;
      
      const detectedRooms = rooms
        .filter(room => {
          const w = Math.abs(room.x2 - room.x1) * scaleX;
          const h = Math.abs(room.y2 - room.y1) * scaleY;
          return w >= 2 && h >= 2 && w <= 10 && h <= 10;
        })
        .map(room => {
          const x = ((room.x1 + room.x2) / 2) * scaleX;
          const z = ((room.y1 + room.y2) / 2) * scaleY;
          const w = Math.abs(room.x2 - room.x1) * scaleX;
          const h = Math.abs(room.y2 - room.y1) * scaleY;
          const area = w * h;
          const aspectRatio = Math.max(w / h, h / w);
          const type = detectRoomType(area, aspectRatio);
          
          return {
            type,
            x: Math.max(w / 2, Math.min(12 - w / 2, x)),
            z: Math.max(h / 2, Math.min(10 - h / 2, z)),
            w: Math.round(w * 2) / 2,
            l: Math.round(h * 2) / 2,
            area,
            confidence: 0.7 + Math.random() * 0.3,
          };
        })
        .slice(0, 8);
      
      resolve(detectedRooms);
    }, 2000);
  });
};

const detectEdges = (grayscale, width, height) => {
  const edges = new Uint8Array(width * height);
  const threshold = 30;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      
      const gx = 
        -1 * grayscale[idx - width - 1] + 1 * grayscale[idx - width + 1] +
        -2 * grayscale[idx - 1] + 2 * grayscale[idx + 1] +
        -1 * grayscale[idx + width - 1] + 1 * grayscale[idx + width + 1];
      
      const gy = 
        -1 * grayscale[idx - width - 1] - 2 * grayscale[idx - width] - 1 * grayscale[idx - width + 1] +
        1 * grayscale[idx + width - 1] + 2 * grayscale[idx + width] + 1 * grayscale[idx + width + 1];
      
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      
      edges[idx] = magnitude > threshold ? 255 : 0;
    }
  }
  
  return edges;
};

const detectLines = (edges, width, height) => {
  const horizontalLines = [];
  const verticalLines = [];
  const threshold = width * 0.3;
  
  for (let y = 0; y < height; y += 5) {
    let count = 0;
    let startX = 0;
    
    for (let x = 0; x < width; x++) {
      if (edges[y * width + x] > 0) {
        if (count === 0) startX = x;
        count++;
      } else {
        if (count > threshold / 5) {
          horizontalLines.push({ y, x1: startX, x2: x });
        }
        count = 0;
      }
    }
  }
  
  for (let x = 0; x < width; x += 5) {
    let count = 0;
    let startY = 0;
    
    for (let y = 0; y < height; y++) {
      if (edges[y * width + x] > 0) {
        if (count === 0) startY = y;
        count++;
      } else {
        if (count > threshold / 5) {
          verticalLines.push({ x, y1: startY, y2: y });
        }
        count = 0;
      }
    }
  }
  
  return { horizontal: horizontalLines, vertical: verticalLines };
};

const detectRooms = (lines, width, height) => {
  const rooms = [];
  const minSize = Math.min(width, height) * 0.1;
  
  const hLines = lines.horizontal.sort((a, b) => a.y - b.y);
  const vLines = lines.vertical.sort((a, b) => a.x - b.x);
  
  for (let i = 0; i < hLines.length - 1; i++) {
    for (let j = i + 1; j < hLines.length; j++) {
      const y1 = Math.min(hLines[i].y, hLines[j].y);
      const y2 = Math.max(hLines[i].y, hLines[j].y);
      const h = y2 - y1;
      
      if (h < minSize) continue;
      
      for (let k = 0; k < vLines.length - 1; k++) {
        for (let l = k + 1; l < vLines.length; l++) {
          const x1 = Math.min(vLines[k].x, vLines[l].x);
          const x2 = Math.max(vLines[k].x, vLines[l].x);
          const w = x2 - x1;
          
          if (w >= minSize) {
            const aspectRatio = Math.max(w / h, h / w);
            if (aspectRatio < 3 && w / width > 0.1 && h / height > 0.1) {
              rooms.push({ x1, y1, x2, y2, w, h });
            }
          }
        }
      }
    }
  }
  
  if (rooms.length === 0) {
    const gridX = Math.floor(width / 3);
    const gridY = Math.floor(height / 3);
    
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        rooms.push({
          x1: i * gridX + gridX * 0.1,
          y1: j * gridY + gridY * 0.1,
          x2: (i + 1) * gridX - gridX * 0.1,
          y2: (j + 1) * gridY - gridY * 0.1,
          w: gridX * 0.8,
          h: gridY * 0.8,
        });
      }
    }
  }
  
  return rooms;
};

export const processUploadedImage = async (file) => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please upload an image file'));
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const img = new Image();
      img.onload = async () => {
        try {
          const rooms = await analyzeFloorPlan(img);
          resolve({
            imageUrl: e.target.result,
            rooms,
            imageWidth: img.width,
            imageHeight: img.height,
          });
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};
