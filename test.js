var electron = require('electron');
setTimeout(() => {
  // 显示消息对话框
    electron.dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Information',
        message: 'Hello from the main process!',
        buttons: ['OK']
    }).then(result => {
        console.log(result.response); // 用户点击的按钮索引
    });
  })
