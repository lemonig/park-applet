import { listCommunities } from '../../api/community';

const app = getApp();

Page({
  data: {
    titleProps: {
      title: '选择小区',
    },
    navBarHeight: app.globalData.navBarHeight || 0,
    keyword: '',
    communities: [],
    located: false,
    locating: false,
    loading: false,
    searched: false,
  },

  onLoad() {
    this.lat = null;
    this.lng = null;
    this.fetchList();
    this.locate();
  },

  /**
   * 定位只用于「附近小区」排序展示：拒绝授权/定位失败均不影响选择，
   * 异地发布场景直接搜索即可。
   */
  locate() {
    this.setData({ locating: true });
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.lat = res.latitude;
        this.lng = res.longitude;
        this.setData({ located: true });
        this.fetchList();
      },
      fail: () => {},
      complete: () => this.setData({ locating: false }),
    });
  },

  async fetchList() {
    this.setData({ loading: true });
    try {
      const data = { keyword: this.data.keyword || '' };
      if (this.lat != null && this.lng != null) {
        data.lat = this.lat;
        data.lng = this.lng;
      }
      const res = await listCommunities(data);
      if (res && res.success !== false && Array.isArray(res.data)) {
        const communities = res.data.map((item) => ({
          ...item,
          distanceText: this.formatDistance(item.distanceMeters),
        }));
        this.setData({
          communities,
          searched: true,
        });
      }
    } catch (err) {
      wx.showToast({ title: '获取小区列表失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onSearch(e) {
    this.setData({ keyword: e.detail.value }, () => this.fetchList());
  },

  onSelect(e) {
    const index = e.currentTarget.dataset.index;
    const community = this.data.communities[index];
    if (!community) return;
    const eventChannel = this.getOpenerEventChannel && this.getOpenerEventChannel();
    if (eventChannel) {
      eventChannel.emit('selectCommunity', community);
    }
    wx.navigateBack({ delta: 1 });
  },

  formatDistance(meters) {
    if (meters == null) return '';
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  },
});
