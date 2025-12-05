/*
 * @Author: liweiqiang liweiqiang@grean.com.cn
 * @Date: 2025-11-19 13:08:31
 * @LastEditors: liweiqiang liweiqiang@grean.com.cn
 * @LastEditTime: 2025-11-19 16:35:50
 * @FilePath: \noise-applet\custom-tab-bar\index.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const app = getApp();
Component({
  data: {
   
    value: 0, // 默认选中的值，这里使用页面路径作为唯一标识
    list: [
      {
        value: '/pages/home/index',
        label: '首页',
        icon: 'home' 
      },
 
      {
        value: '/pages/user/index',
        label: '我的',
        icon: 'user'
      }
    ],
    theme: {
      custom: {
        colorPrimary: '#333',
      },
    },
  },

  methods: {
  
    onChange(e) {
      const url = e.detail.value;
      
      // 切换 Tab 页面
      wx.switchTab({
        url: url
      });
      
      // 注意：这里不需要手动 setData 修改 value
      // 因为页面切换后，新页面的 onShow 会负责更新 TabBar 的选中状态
    },
    lifetimes: {
      attached: function () {
        // 在组件实例进入页面节点树时执行
      },
  
    },
    pageLifetimes: {
      show: function() {
        // 页面被展示
        console.log('bar');
      },
  
    },
  

    init() {
      const page = getCurrentPages().pop();
      const route = page ? page.route.split('?')[0] : '';
      const active = this.data.list.findIndex(
        (item) => (item.url.startsWith('/') ? item.url.substr(1) : item.url) === `${route}`,
      );
      this.setData({
        active,
      });
    },
  },
});
