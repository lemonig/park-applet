import { listMarket } from '../../api/market';
import { detail as fetchUserDetail } from '../../api/user';

const DEFAULT_AVATAR = 'https://tdesign.gtimg.com/miniprogram/images/avatar1.png';

Page({
  data: {
    titleProps: {
      title: '我的',
    },
    isLogin: false,
    userInfo: null,
    avatar: DEFAULT_AVATAR,
    stats: {
      total: 0,
      pending: 0,
      approved: 0,
    },
    menuList: [
      { key: 'publishSale', title: '发布出售车位', icon: 'add-circle', url: '/pages/carport-form/index?type=1' },
      { key: 'publishRent', title: '发布出租车位', icon: 'add-circle', url: '/pages/carport-form/index?type=2' },
      { key: 'my', title: '我的发布', icon: 'view-list', url: '/pages/carport-form/index?mine=1' },
      { key: 'service', title: '联系客服', icon: 'service', action: 'contactService' },
      { key: 'about', title: '关于我们', icon: 'info-circle', action: 'showAbout' },
    ],
    logoutDialog: {
      visible: false,
      title: '提示',
      content: '确定退出当前账号吗？',
      confirmBtn: '退出',
      cancelBtn: '取消',
    },
  },

  // 加载本地缓存的用户信息
  loadLocalUser() {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    if (token && userInfo) {
      this.setData({
        isLogin: true,
        userInfo,
        avatar: userInfo.avatar || DEFAULT_AVATAR,
      });
      return userInfo;
    }
    this.setData({
      isLogin: false,
      userInfo: null,
      avatar: DEFAULT_AVATAR,
      stats: { total: 0, pending: 0, approved: 0 },
    });
    return null;
  },

  // 拉取最新用户信息
  async refreshUserDetail() {
    const local = this.data.userInfo;
    if (!local || !local.id) return;
    try {
      const res = await fetchUserDetail({ id: local.id });
      if (res && res.success && res.data) {
        const merged = { ...local, ...res.data };
        wx.setStorageSync('userInfo', merged);
        this.setData({
          userInfo: merged,
          avatar: merged.avatar || DEFAULT_AVATAR,
        });
      }
    } catch (err) {
      // 静默失败，使用本地缓存
    }
  },

  // 拉取我的发布统计
  async fetchStats() {
    if (!this.data.isLogin) return;
    try {
      const res = await listMarket({ pageNum: 1, pageSize: 1 });
      const total = res && res.page ? res.page.total : 0;
      this.setData({ 'stats.total': total });
    } catch (err) {
      // ignore
    }
  },

  // 跳转登录
  goLogin() {
    wx.navigateTo({ url: '/pages/login/index' });
  },

  // 菜单点击
  onMenuTap(e) {
    const { key, url, action } = e.currentTarget.dataset;
    if (!this.requireLogin(key)) return;

    if (action === 'contactService') {
      wx.showModal({
        title: '联系客服',
        content: '客服电话：400-000-0000',
        confirmText: '拨打',
        success: (r) => {
          if (r.confirm) {
            wx.makePhoneCall({ phoneNumber: '4000000000' });
          }
        },
      });
      return;
    }
    if (action === 'showAbout') {
      wx.showModal({
        title: '关于我们',
        content: '车位租售平台 v1.0.0',
        showCancel: false,
      });
      return;
    }
    if (url) {
      wx.navigateTo({ url });
    }
  },

  // 未登录拦截（部分菜单允许免登录浏览，这里发布与我的需登录）
  requireLogin(key) {
    const needLoginKeys = ['publishSale', 'publishRent', 'my', 'profile'];
    if (needLoginKeys.includes(key) && !this.data.isLogin) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      setTimeout(() => this.goLogin(), 600);
      return false;
    }
    return true;
  },

  // 头像/昵称区域点击
  onProfileTap() {
    if (!this.data.isLogin) {
      this.goLogin();
      return;
    }
    wx.showToast({ title: '资料编辑功能开发中', icon: 'none' });
  },

  // 统计点击 -> 跳「我的发布」
  onStatsTap() {
    if (!this.requireLogin('my')) return;
    wx.navigateTo({ url: '/pages/carport-form/index?mine=1' });
  },

  // 退出登录
  onLogoutTap() {
    this.setData({ 'logoutDialog.visible': true });
  },
  onLogoutConfirm() {
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
    this.setData({
      'logoutDialog.visible': false,
      isLogin: false,
      userInfo: null,
      avatar: DEFAULT_AVATAR,
      stats: { total: 0, pending: 0, approved: 0 },
    });
    wx.showToast({ title: '已退出登录', icon: 'success' });
    setTimeout(() => this.goLogin(), 600);
  },
  onLogoutCancel() {
    this.setData({ 'logoutDialog.visible': false });
  },

  onLoad() {
    const user = this.loadLocalUser();
    if (user) {
      this.refreshUserDetail();
      this.fetchStats();
    }
  },

  onShow() {
    const user = this.loadLocalUser();
    if (user) {
      this.fetchStats();
    }
    if (this.getTabBar) {
      const tabBar = this.getTabBar();
      if (tabBar && tabBar.init) tabBar.init();
    }
  },

  onPullDownRefresh() {
    const user = this.loadLocalUser();
    Promise.all([
      user ? this.refreshUserDetail() : Promise.resolve(),
      user ? this.fetchStats() : Promise.resolve(),
    ]).finally(() => wx.stopPullDownRefresh());
  },

  onShareAppMessage() {
    return {
      title: '车位租售平台',
      path: '/pages/home/index',
    };
  },
});
