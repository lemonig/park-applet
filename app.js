// app.js
import { wxLogin } from "./api/user";
import Monitor from './utils/monitor';
App(
  Monitor.hookApp({
    onError(err) {
        console.log('进入onError:', err);
    },
    onLaunch() {
      // 展示本地存储能力
      const logs = wx.getStorageSync('logs') || []
      logs.unshift(Date.now())
      wx.setStorageSync('logs', logs)
  
      const that = this;
      // 获取系统信息
      const systemInfo = wx.getSystemInfoSync();
      // 胶囊按钮位置信息
      const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
      // 导航栏高度 = 状态栏高度 + 44
      that.globalData.navBarHeight = systemInfo.statusBarHeight + 44;
      that.globalData.menuRight = systemInfo.screenWidth - menuButtonInfo.right;
      that.globalData.menuTop = menuButtonInfo.top;
      that.globalData.menuHeight = menuButtonInfo.height;

      // 静默登录 / 续期
      this.silentLogin();

    },
    // 静默登录：wx.login 换 code，携带旧 token 续期，成功后写入本地
    silentLogin() {
      const oldToken = wx.getStorageSync('token') || '';
      wx.login({
        success: async ({ code }) => {
          if (!code) return;
          try {
            const res = await wxLogin({ code, token: oldToken });
            if (res && res.success !== false && res.data && res.data.token) {
              wx.setStorageSync('token', res.data.token);
              wx.setStorageSync('userInfo', res.data);
              this.globalData.userInfo = res.data;
            }
          } catch (err) {
            // 静默失败，不打断用户
            console.log('silent login failed', err);
          }
        },
        fail() {
          // 忽略
        },
      });
    },
    globalData: {
      userInfo: null,
      globalData: {
        navBarHeight: 0, // 导航栏高度
        menuRight: 0, // 胶囊距右方间距（方保持左、右间距一致）
        menuTop: 0, // 胶囊距底部间距（保持底部间距一致）
        menuHeight: 0, // 胶囊高度（自定义内容可与胶囊高度保证一致）
      },
      taskNum: 0, //任务数量标记
  
    }
  })
)