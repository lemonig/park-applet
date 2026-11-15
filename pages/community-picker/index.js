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
    markers: [],
    mapCenter: null,
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
   * 定位只用于「附近小区」排序与地图展示我的位置：拒绝授权/定位失败
   * 均不影响选择，异地发布场景直接搜索即可。
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
        this.buildMarkers(communities);
      }
    } catch (err) {
      wx.showToast({ title: '获取小区列表失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 地图 markers 来自小区库坐标；地图中心优先定位点，
   * 未定位时落在第一个有坐标的小区上。
   */
  buildMarkers(communities) {
    const located = communities.filter((c) => c.lat != null && c.lng != null);
    if (!located.length) {
      this.setData({ markers: [], mapCenter: null });
      return;
    }
    const markers = located.map((c) => ({
      id: c.id,
      latitude: Number(c.lat),
      longitude: Number(c.lng),
      width: 26,
      height: 34,
      callout: {
        content: c.name,
        display: 'ALWAYS',
        padding: 6,
        borderRadius: 6,
        fontSize: 12,
        color: '#076b3a',
      },
    }));
    const first = located[0];
    const center = this.data.located && this.lat != null
      ? { latitude: this.lat, longitude: this.lng }
      : { latitude: Number(first.lat), longitude: Number(first.lng) };
    this.setData({ markers, mapCenter: center });
  },

  onSearch(e) {
    this.setData({ keyword: e.detail.value }, () => this.fetchList());
  },

  onMarkerTap(e) {
    const markerId = e.detail && e.detail.markerId;
    const community = this.data.communities.find((c) => c.id === markerId);
    if (community) {
      this.selectCommunity(community);
    }
  },

  onSelect(e) {
    const index = e.currentTarget.dataset.index;
    const community = this.data.communities[index];
    if (community) {
      this.selectCommunity(community);
    }
  },

  selectCommunity(community) {
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
