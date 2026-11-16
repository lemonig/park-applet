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

  // 选择微信头像：仅本地预览（chooseAvatar 给的是临时路径），
  // 点「保存」时才上传 COS 并随表单一并落库；不保存返回则不变更
  onChooseAvatar(e) {
    const filePath = e && e.detail && e.detail.avatarUrl;
    if (!filePath) return;
    this.avatarTempPath = filePath;
    this.setData(buildAvatarData({ avatar: filePath }));
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
    if (this.data.saving) return;
    const error = this.validateForm();
    if (error) {
      wx.showToast({ title: error, icon: 'none' });
      return;
    }
    this.setData({ saving: true });
    try {
      const payload = {
        name: this.data.form.name.trim(),
        mobile: (this.data.form.mobile || '').trim(),
        description: (this.data.form.description || '').trim(),
      };

      // 头像换过才上传：失败则中断本次保存（文本字段未落库，可重试）
      let avatarUrl = null;
      if (this.avatarTempPath) {
        wx.showLoading({ title: '上传头像中', mask: true });
        const up = await uploadFile(this.avatarTempPath);
        wx.hideLoading();
        avatarUrl = up && up.data && up.data.url;
        if (!avatarUrl) {
          wx.showToast({ title: '头像上传失败', icon: 'none' });
          this.setData({ saving: false });
          return;
        }
        payload.avatar = avatarUrl;
      }

      const res = await updateUserProfile(payload);
      if (res && res.success !== false) {
        // 登录缓存用 nickname 展示、profile 用 name，两个键同步更新
        const patch = {
          name: payload.name,
          nickname: payload.name,
          mobile: payload.mobile,
          description: payload.description,
        };
        if (avatarUrl) patch.avatar = avatarUrl;
        this.mergeStorage(patch);
        wx.showToast({ title: '已保存', icon: 'success' });
        setTimeout(() => wx.navigateBack({ delta: 1 }), 800);
      } else {
        wx.showToast({ title: '保存失败', icon: 'none' });
        this.setData({ saving: false });
      }
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '保存失败', icon: 'none' });
      this.setData({ saving: false });
    }
  },
});
