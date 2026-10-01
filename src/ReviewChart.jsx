import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

export default function ReviewChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        className="review-chart"
        data={data}
        margin={{ top: 10, right: 12, bottom: 0, left: -16 }}
        accessibilityLayer
      >
        <CartesianGrid vertical={false} stroke="var(--line)" />
        <XAxis
          dataKey="label"
          interval={1}
          tickMargin={12}
          tickLine={false}
          axisLine={{ stroke: 'var(--blue)', strokeWidth: 2 }}
          tick={{ fill: 'var(--mute)', fontSize: 11 }}
        />
        <YAxis
          allowDecimals={false}
          width={32}
          tickLine={false}
          axisLine={false}
          tick={{ fill: 'var(--mute)', fontSize: 11 }}
        />
        <Tooltip
          labelFormatter={(_, payload) => {
            const date = payload?.[0]?.payload?.date;
            return date
              ? new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })
              : '';
          }}
          formatter={(value) => [value, 'Reviews']}
          contentStyle={{
            background: 'var(--paper)',
            border: '1px solid var(--line)',
            borderRadius: 8,
            color: 'var(--ink)',
            boxShadow: 'var(--shadow)'
          }}
          labelStyle={{ color: 'var(--mute)', marginBottom: 4 }}
        />
        <Area
          type="monotone"
          dataKey="count"
          name="Reviews"
          stroke="var(--blue)"
          strokeWidth={2.5}
          fill="var(--blue)"
          fillOpacity={0.12}
          activeDot={{ r: 5, fill: 'var(--blue)', stroke: 'var(--paper)', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}