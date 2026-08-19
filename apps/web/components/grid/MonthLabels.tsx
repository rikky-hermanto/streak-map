import { dateFromDateKey } from '@streak-map/core';

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

interface MonthLabelsProps {
  weekStartKeys: string[];
}

export function MonthLabels({ weekStartKeys }: MonthLabelsProps) {
  let lastMonth = -1;
  return (
    <div className="flex gap-[3px] pl-[17px]">
      {weekStartKeys.map((key) => {
        const month = dateFromDateKey(key).getMonth();
        const showLabel = month !== lastMonth;
        if (showLabel) lastMonth = month;
        return (
          <div
            key={key}
            className="min-w-0 flex-1 overflow-visible whitespace-nowrap font-mono text-[10px] text-tx3"
          >
            {showLabel ? MONTH_NAMES[month] : ''}
          </div>
        );
      })}
    </div>
  );
}
