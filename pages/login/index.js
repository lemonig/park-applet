// index.js
// 获取应用实例
import { wxLogin } from '../../api/user';
const app = getApp();
Page({
  data: {
    navBarHeight: app.globalData.navBarHeight,
    titleProps: {
      title: '登录',
    },
    loading: false,
    agreed: false,
    hasUserInfo: false,
    errMsg: '',
  },
  onLoad() {},
  handleAgreeChange(e) {
    this.setData({ agreed: e.detail.checked });
  },
  checkAgreement() {
    if (!this.data.agreed) {
      wx.showToast({ title: '请先同意用户协议和隐私政策', icon: 'none' });
      return false;
    }
    return true;
  },
  saveLogin(data) {
    wx.setStorageSync('token', data.token);
    wx.setStorageSync('userInfo', data);
    wx.switchTab({
      url: '/pages/home/index',
    });
  },
  handleWechatLogin() {
    if (this.data.loading) return;
    if (!this.checkAgreement()) return;
    this.setData({ loading: true, errMsg: '' });
    wx.login({
      success: async ({ code }) => {
        if (!code) {
          this.setData({ loading: false, errMsg: '微信登录失败' });
          wx.showToast({ title: '微信登录失败', icon: 'none' });
          return;
        }
        try {
          const res = await wxLogin({ code });
          if (res && res.success && res.data) {
            this.saveLogin(res.data);
            return;
          }
          this.setData({ errMsg: res.message || '微信登录失败' });
        } catch (err) {
          this.setData({ errMsg: '微信登录失败，请稍后重试' });
        } finally {
          this.setData({ loading: false });
        }
      },
      fail: () => {
        this.setData({ loading: false, errMsg: '微信登录失败' });
        wx.showToast({ title: '微信登录失败', icon: 'none' });
      },
    });
  },
  getPhoneNumber(e) {
  },
});
