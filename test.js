const { app, BrowserWindow } = electron;

// 在应用 ready 后执行
app.whenReady().then(() => {
  // 获取用户文档目录（跨平台）
  const userDataPath = app.getPath('userData');
  
  // 定义文件路径
  const filePath = path.join(userDataPath, 'my-electron-app', 'example.txt');
  
  // 确保目录存在
  const dirPath = path.dirname(filePath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  // 写入文件
  fs.writeFile(filePath, '这是要写入的文本内容', (err) => {
    if (err) {
      console.error('写入文件失败:', err);
    } else {
      console.log('文件写入成功:', filePath);
    }
  });
});
