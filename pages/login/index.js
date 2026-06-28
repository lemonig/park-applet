// index.js
// 获取应用实例
import { login, wxLogin } from '../../api/user';
const app = getApp();
const validate = require('../../utils/validate');
Page({
  data: {
    navBarHeight: app.globalData.navBarHeight,
    titleProps: {
      title: '登录',
    },
    loginMode: 'wechat',
    loading: false,
    form: {
      account: {
        label: '账号',
        value: 'admin',
        rules: 'isPassword',
        validate: false,
        errorText: '',
      },
      password: {
        label: '密码',
        value: 'park!123',
        rules: 'isPassword',
        validate: false,
        errorText: '',
      },
    },
    hasUserInfo: false,
    errMsg: '',
  },
  onLoad() {},
  switchLoginMode() {
    this.setData({
      loginMode: this.data.loginMode === 'wechat' ? 'password' : 'wechat',
      errMsg: '',
    });
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
  //  用户名输入框输入方法
  handleUsernameInput(e) {
    this.data.form.account.value = e.detail;
  },
  //  密码输入框输入方法
  handlePasswordInput(e) {
    this.data.form.password.value = e.detail;
  },
  //  表单验证方法
  formValidate() {
    const data = {};
    let pass = true;
    for (const key in this.data.form) {
      if (!validate[this.data.form[key].rules](this.data.form[key].value)) {
        if (this.data.form[key].value) {
          this.data.form[key].errorText = '请勿输入非法字符';
        }
        this.data.form[key].validate = true;
        pass = false;
      } else {
        this.data.form[key].validate = false;
        this.data.form[key].errorText = '';
        data[key] = this.data.form[key].value;
      }
    }
    this.setData({
      form: this.data.form,
    });
    return pass ? data : false;
  },
  //  登录方法
  async handleLogin() {
    const params = this.formValidate();
    console.log(params);
    if (!params) return;
    this.setData({ loading: true });
    // params.password = hexMD5(params.password);
    let { data, success } = await login(params);
    if (success) {
      this.saveLogin(data);
      return;
    }
    this.setData({ loading: false });
  },

  getPhoneNumber(e) {
  },
  gotoLoginCode(){
    wx.navigateTo({
      url: '/pages/login-code/index',
    })
  },

});
