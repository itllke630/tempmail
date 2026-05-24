import { useState, useEffect, useCallback } from 'react'; // fix: 导入 useCallback
import { useTranslation } from 'react-i18next';
import { ClockIcon, RefreshIcon } from "./icons";

// 定义组件的 props 类型
interface CountdownTimerProps {
  expiryTimestamp: number; // 过期时间戳 (毫秒)
  onReset: () => void; // 修改：回调函数名称从 onExtend 改为 onReset
}

// 格式化时间单位，确保总是显示两位数
const formatTimeUnit = (unit: number): string => {
  return unit < 10 ? `0${unit}` : `${unit}`;
};

// 修改：组件名称和 prop 名称修改
export function CountdownTimer({ expiryTimestamp, onReset }: CountdownTimerProps) {
  const { t } = useTranslation(); // 用于国际化

  // 计算剩余时间的函数 (使用 useCallback 避免不必要的重新创建)
  const calculateTimeLeft = useCallback(() => {
    // 直接使用最新的 expiryTimestamp prop
    const difference = expiryTimestamp - Date.now();
    let timeLeft = {
      hours: '00',
      minutes: '00',
      seconds: '00',
      expired: difference <= 0,
    };

    if (difference > 0) {
      const totalSeconds = Math.floor(difference / 1000);
      const seconds = totalSeconds % 60;
      const totalMinutes = Math.floor(totalSeconds / 60);
      const minutes = totalMinutes % 60;
      const hours = Math.floor(totalMinutes / 60); // 不再限制 % 24，可以显示超过一天的时间

      timeLeft = {
        hours: formatTimeUnit(hours),
        minutes: formatTimeUnit(minutes),
        seconds: formatTimeUnit(seconds),
        expired: false,
      };
    }

    return timeLeft;
  }, [expiryTimestamp]); // expiryTimestamp 作为依赖项

  // 使用 useState 来存储剩余时间
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  // 使用 useEffect 来设置定时器，每秒更新剩余时间
  useEffect(() => {
    // 立即计算一次以避免初始延迟
    setTimeLeft(calculateTimeLeft());

    // 设置定时器
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // 组件卸载或 expiryTimestamp 变化时清除定时器
    // fix: 将 expiryTimestamp 添加到依赖项，确保每次时间戳更新时都重置定时器
    return () => clearInterval(timer);
  }, [expiryTimestamp, calculateTimeLeft]); // 依赖项包含 expiryTimestamp 和 calculateTimeLeft

  // 当计算出的时间显示已过期时，停止计时器（通过清除上一个 effect 实现）
  useEffect(() => {
    if (timeLeft.expired) {
      // 定时器已在上面的 effect 的 cleanup 函数中清除
      // 这里可以额外处理过期逻辑，如果需要的话
    }
  }, [timeLeft.expired]);

  return (
    // feat: 将容器改为 flex-row 并添加按钮
    <div className="flex items-center justify-between gap-2 text-sm my-4 p-3 rounded-md border shadow-inner text-amber-700 dark:text-cyan-400 bg-amber-50 dark:bg-white/5 border-amber-200 dark:border-cyan-50/20">
      <div className="flex items-center gap-2">
        <ClockIcon className="w-5 h-5" />
        {timeLeft.expired ? (
          <span>{t('Email expired')}</span>
        ) : (
          <span>
            {t('Expires in')}: {timeLeft.hours}:{timeLeft.minutes}:{timeLeft.seconds}
          </span>
        )}
      </div>
      {!timeLeft.expired && (
        <button
          onClick={onReset}
          className="p-1 rounded text-amber-600 hover:text-amber-500 dark:text-cyan-400 dark:hover:text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          title={t('Reset validity')}
        >
          <RefreshIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}