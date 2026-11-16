import { detail as fetchUserDetail, update as updateUserProfile } from '../../api/user';
import { uploadFile } from '../../api/public';

// 与我的页保持同一默认头像
const DEFAULT_AVATAR = '/assets/imgs/avatar-default.jpg';
const MOBILE_REG = /^1\d{10}$/;

// input/textarea 取值兼容（同 carport-form）
function getInputValue(e) {
  if (e && e.detail && typeof e.detail === 'object' && Object.prototype.hasOwnProperty.call(e.detail, 'value')) {
    return e.detail.value;
  }
  return e ? e.detail : '';
}

function buildAvatarData(profile) {
  return {
    avatar: (profile && profile.avatar) || DEFAULT_AVATAR,
  };
}

Page({
  data: {
    titleProps: {
      title: '个人资料',
    },
    form: {
      name: '',
      mobile: '',
      description: '',
    },
    ...buildAvatarData(null),
    avatarSaving: false,
    saving: false,
  },

  onLoad() {
    if (!wx.getStorageSync('token')) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      setTimeout(() => wx.redirectTo({ url: '/pages/login/index' }), 600);
      return;
    }
    // 先用本地缓存预填避免闪空白，再拉服务端最新资料回填
    this.applyProfile(wx.getStorageSync('userInfo') || {});
    this.refreshDetail();
  },

  // 拉服务端最新资料（profile 接口返回 name 字段；登录缓存是 nickname）
  async refreshDetail() {
    try {
      const res = await fetchUserDetail();
      if (res && res.success !== false && res.data) {
        this.applyProfile(res.data);
      }
    } catch (err) {
      // 回填失败保持本地预填
    }
  },

  applyProfile(profile) {
    this.setData({
      form: {
        name: profile.name || profile.nickname || '',
        mobile: profile.mobile || '',
        description: profile.description || '',
      },
      ...buildAvatarData(profile),
    });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`form.${field}`]: getInputValue(e),
    });
  },

  // 选择微信头像：上传 COS 后持久化（与我的页同一管线）
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
        this.mergeStorage({ avatar: url });
        this.setData(buildAvatarData({ avatar: url }));
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

  // '' 昵称不能存（DB NOT NULL）、手机号清空存空串（动态 SQL 会落库）
  validateForm() {
    const name = (this.data.form.name || '').trim();
    if (!name) return '请输入昵称';
    const mobile = (this.data.form.mobile || '').trim();
    if (mobile && !MOBILE_REG.test(mobile)) return '手机号格式不正确';
    return '';
  },

  // 合并写回本地缓存：我的页 onShow 从 storage 读取展示
  mergeStorage(patch) {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) return;
    wx.setStorageSync('userInfo', { ...userInfo, ...patch });
  },

  async submitForm() {
    if (this.data.saving || this.data.avatarSaving) return;
    const error = this.validateForm();
    if (error) {
      wx.showToast({ title: error, icon: 'none' });
      return;
    }
    this.setData({ saving: true });
    try {
      const name = this.data.form.name.trim();
      const mobile = (this.data.form.mobile || '').trim();
      const description = (this.data.form.description || '').trim();
      const res = await updateUserProfile({ name, mobile, description });
      if (res && res.success !== false) {
        // 登录缓存用 nickname 展示、profile 用 name，两个键同步更新
        this.mergeStorage({ name, nickname: name, mobile, description });
        wx.showToast({ title: '已保存', icon: 'success' });
        setTimeout(() => wx.navigateBack({ delta: 1 }), 800);
      } else {
        wx.showToast({ title: '保存失败', icon: 'none' });
        this.setData({ saving: false });
      }
    } catch (err) {
      wx.showToast({ title: '保存失败', icon: 'none' });
      this.setData({ saving: false });
    }
  },
});
