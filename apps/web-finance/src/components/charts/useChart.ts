import type * as echarts from 'echarts';
import type { Ref } from 'vue';

import { computed, nextTick, onMounted, onUnmounted, ref, unref, watch } from 'vue';

import { useDebounceFn } from '@vueuse/core';
import * as echartCore from 'echarts/core';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
} from 'echarts/components';
import { LabelLayout, UniversalTransition } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';

// 注册必要的组件
echartCore.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  ToolboxComponent,
  DataZoomComponent,
  BarChart,
  LineChart,
  PieChart,
  CanvasRenderer,
  UniversalTransition,
  LabelLayout,
]);

export type EChartsOption = echarts.EChartsOption;
export type EChartsInstance = echarts.ECharts;

export interface UseChartOptions {
  theme?: string | object;
  initOptions?: echarts.EChartsCoreOption;
  loading?: boolean;
  loadingOptions?: object;
}

export function useChart(
  elRef: Ref<HTMLDivElement | null>,
  options: UseChartOptions = {},
) {
  const { theme = 'light', initOptions = {}, loading = false, loadingOptions = {} } = options;

  let chartInstance: EChartsInstance | null = null;
  const cacheOptions = ref<EChartsOption>({});
  const isDisposed = ref(false);

  // 获取图表实例
  const getChartInstance = (): EChartsInstance | null => {
    if (!elRef.value || isDisposed.value) {
      return null;
    }

    if (!chartInstance) {
      chartInstance = echartCore.init(elRef.value, theme, initOptions);
    }

    return chartInstance;
  };

  // 设置图表配置
  const setOptions = (options: EChartsOption, clear = true) => {
    cacheOptions.value = options;
    nextTick(() => {
      if (!isDisposed.value) {
        const instance = getChartInstance();
        if (instance) {
          clear && instance.clear();
          instance.setOption(options);
        }
      }
    });
  };

  // 获取图表配置
  const getOptions = (): EChartsOption => {
    return cacheOptions.value;
  };

  // 调整图表大小
  const resize = useDebounceFn(() => {
    const instance = getChartInstance();
    instance?.resize();
  }, 200);

  // 销毁图表
  const dispose = () => {
    if (chartInstance) {
      chartInstance.dispose();
      chartInstance = null;
      isDisposed.value = true;
    }
  };

  // 监听 loading 状态
  watch(
    () => loading,
    (val) => {
      const instance = getChartInstance();
      if (instance) {
        if (val) {
          instance.showLoading(loadingOptions);
        } else {
          instance.hideLoading();
        }
      }
    },
  );

  // 监听元素变化，重新初始化
  watch(
    elRef,
    (el) => {
      if (el) {
        isDisposed.value = false;
        setOptions(cacheOptions.value);
      }
    },
  );

  // 挂载时初始化
  onMounted(() => {
    window.addEventListener('resize', resize);
  });

  // 卸载时清理
  onUnmounted(() => {
    window.removeEventListener('resize', resize);
    dispose();
  });

  return {
    getInstance: getChartInstance,
    setOptions,
    getOptions,
    resize,
    dispose,
  };
}