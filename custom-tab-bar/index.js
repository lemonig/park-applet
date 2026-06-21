const app = getApp();

Component({
  data: {
    value: '/pages/home/index',
    list: [
      {
        value: '/pages/home/index',
        label: '首页',
        icon: 'home',
      },
      {
        value: '/pages/user/index',
        label: '我的',
        icon: 'user',
      },
    ],
    // 自定义 TDesign 主题色：选中态颜色（与 app.json selectedColor 保持一致）
    theme: {
      custom: {
        colorPrimary: '#1E8AE8',
      },
    },
  },

  lifetimes: {
    attached() {
      this.init();
    },
  },

  pageLifetimes: {
    show() {
      this.init();
    },
  },

  methods: {
    onChange(e) {
      const url = e.detail.value;
      if (url === this.data.value) return;
      this.setData({ value: url });
      wx.switchTab({ url });
    },

    init() {
      const page = getCurrentPages().pop();
      if (!page) return;
      const route = `/${page.route.split('?')[0]}`;
      const matched = this.data.list.find((item) => item.value === route);
      if (matched && this.data.value !== matched.value) {
        this.setData({ value: matched.value });
      }
    },
  },
});
