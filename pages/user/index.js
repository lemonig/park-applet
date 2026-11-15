import { listMyMarket } from '../../api/market';
import { detail as fetchUserDetail, update as updateUserProfile } from '../../api/user';
import { uploadFile } from '../../api/public';

// 默认头像：本地处理的跑车图（512x512，约 16KB）
const DEFAULT_AVATAR = '/assets/imgs/avatar-default.jpg';

// 由用户信息推导头像区显示数据，无头像时回落到默认图
function buildAvatarData(userInfo) {
  return {
    avatar: (userInfo && userInfo.avatar) || DEFAULT_AVATAR,
  };
}

Page({
  data: {
    titleProps: {
      title: '我的',
    },
    isLogin: false,
    userInfo: null,
    ...buildAvatarData(null),
    avatarSaving: false,
    stats: {
      total: 0,
      pending: 0,
      approved: 0,
    },
    menuList: [
      { key: 'my', title: '我的发布', icon: 'view-list', url: '/pages/my-market/index' },
      { key: 'favorite', title: '我的收藏', icon: 'star', url: '/pages/my-favorite/index' },
      { key: 'feedback', title: '意见反馈', icon: 'chat', url: '/pages/feedback/index' },
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
        ...buildAvatarData(userInfo),
      });
      return userInfo;
    }
    this.setData({
      isLogin: false,
      userInfo: null,
      ...buildAvatarData(null),
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
          ...buildAvatarData(merged),
        });
      }
    } catch (err) {
      // 静默失败，使用本地缓存
    }
  },

  // 用户选择了微信头像：上传后持久化
  async onChooseAvatar(e) {
    const filePath = e && e.detail && e.detail.avatarUrl;
    if (!filePath || this.data.avatarSaving) return;
    this.setData({ avatarSaving: true });
    wx.showLoading({ title: '保存中', mask: true });
    try {
      const up = await uploadFile(filePath);
      const url = up && up.data && up.data.url;
      if (!url) {
        wx.showToast({ title: '头像上传失败', icon: 'none' });
        return;
      }
      const res = await updateUserProfile({ avatar: url });
      if (res && res.success !== false) {
        const merged = { ...this.data.userInfo, avatar: url };
        wx.setStorageSync('userInfo', merged);
        this.setData({
          userInfo: merged,
          ...buildAvatarData(merged),
        });
        wx.showToast({ title: '头像已更新', icon: 'success' });
      } else {
        wx.showToast({ title: '头像保存失败', icon: 'none' });
      }
    } catch (err) {
      wx.showToast({ title: '头像保存失败', icon: 'none' });
    } finally {
      wx.hideLoading();
      this.setData({ avatarSaving: false });
    }
  },

  // 拉取我的发布统计
  async fetchStats() {
    if (!this.data.isLogin) return;
    try {
      const [allRes, pendingRes, approvedRes] = await Promise.all([
        listMyMarket({ pageNum: 1, pageSize: 1 }),
        listMyMarket({ pageNum: 1, pageSize: 1, status: 0 }),
        listMyMarket({ pageNum: 1, pageSize: 1, status: 1 }),
      ]);
      this.setData({
        'stats.total': allRes && allRes.page ? allRes.page.total : 0,
        'stats.pending': pendingRes && pendingRes.page ? pendingRes.page.total : 0,
        'stats.approved': approvedRes && approvedRes.page ? approvedRes.page.total : 0,
      });
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

  // 未登录拦截（部分菜单允许免登录浏览）
  requireLogin(key) {
    const needLoginKeys = ['my', 'favorite', 'profile', 'feedback'];
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

  // 阻止头像按钮的 tap 冒泡到资料区
  noop() {},

  // 统计点击 -> 跳「我的发布」
  onStatsTap() {
    if (!this.requireLogin('my')) return;
    wx.navigateTo({ url: '/pages/my-market/index' });
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
      ...buildAvatarData(null),
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
