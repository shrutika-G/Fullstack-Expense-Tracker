import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

function IncomeVsExpenseChart({ data }) {

    const chartData = data?.map((item) => {
        const expense = item.totalExpense || 0;
        const income = item.totalIncome || 0;
        const total = expense + income;

        return {
            ...item,

            expensePercentage:
                total === 0
                    ? 0
                    : Number(((expense / total) * 100).toFixed(2)),

            incomePercentage:
                total === 0
                    ? 0
                    : Number(((income / total) * 100).toFixed(2))
        };
    });

    return (
        <ResponsiveContainer width="100%" height={500}>
            <LineChart
                data={chartData}
                margin={{
                    top: 20,
                    right: 20,
                    left: 20,
                    bottom: 10,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="monthName" fontSize="10px" />

                <YAxis
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                />

                <Tooltip
                    formatter={(value, name, props) => {

                        if (name === "Expense") {
                            return [
                                `${value}% (Amount: ₹${props.payload.totalExpense})`,
                                "Expense"
                            ];
                        }

                        return [
                            `${value}% (Amount: ₹${props.payload.totalIncome})`,
                            "Income"
                        ];
                    }}
                />

                <Legend />

                <Line
                    type="monotone"
                    dataKey="expensePercentage"
                    name="Expense"
                    stroke="#ff0000"
                    activeDot={{ r: 5 }}
                />

                <Line
                    type="monotone"
                    dataKey="incomePercentage"
                    name="Income"
                    stroke="#6aa412"
                />
            </LineChart>
        </ResponsiveContainer>
    );
}

export default IncomeVsExpenseChart;