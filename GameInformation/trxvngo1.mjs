import axios from "axios";
import moment from "moment-timezone";

// 发送计划的频道
const channelUsername = "@gameresult";

// 统计信息
const statistics = {
  totalPredictions: 0,
  wins: 0,
  losses: 0,
};

const gameResults = [];
let previousResults = null;

// 获取印度时间
const getIndiaTime = async () => {
  try {
    const response = await axios.get('https://worldtimeapi.org/api/timezone/Asia/Kolkata');
    return response.data.datetime;
  } catch (error) {
    console.error('获取印度时间时出错:', error);
    return moment().tz("Asia/Kolkata").format(); 
  }
};

// 重置统计信息
const resetStatistics = () => {
  statistics.totalPredictions = 0;
  statistics.wins = 0;
  statistics.losses = 0;
  console.log("统计信息已重置");
};

// 获取游戏结果
const getGameResults = async () => {
  const url = "https://lottstars.com/result/getResult";
  const indiaTime = await getIndiaTime(); // 获取当前印度时间
  let currentDate = moment(indiaTime);

  // 检查时间是否为0时0分
  if (currentDate.hour() === 0 && currentDate.minute() === 0) {
    currentDate = currentDate.subtract(1, 'day');
    resetStatistics();
  }

  const formattedDate = currentDate.format('YYYY-MM-DD');

  try {
    const response = await axios.get(url, {
      params: {
        game: "trxvngo1",
        date: formattedDate,
        page: 1,
        limit: 10,
      },
    });
    if (gameResults.length > 0) {
      // 更新预测结果
      await updateForecastResults(response.data.data.list[0]);
    }
    return response.data;
  } catch (error) {
    console.error("获取游戏结果时出错:", error);
    return { data: { list: [] } };
  }
};

// 自动推送功能
const sendResults_trxvngo1 = async (bot) => {
  let results = await getGameResults();

  if (
    (previousResults &&
      JSON.stringify(results) === JSON.stringify(previousResults)) ||
    results.length < 0
  ) {
    console.log("结果与上次相同，返回");
    return;
  }

  previousResults = results;

  if (results.data.list.length === 0) {
    console.log("没有获取到游戏结果");
    return;
  }

  const latestResult = results.data.list[0];
  const latestPeriod = latestResult.period;
  const nextPrediction = await predictNextResult(latestPeriod);

  if (!gameResults.some((result) => result.period === nextPrediction.period)) {
    gameResults.push(nextPrediction);
    if (gameResults.length > 10) {
      gameResults.shift();
    }
  }

  const message = formatMessage(gameResults);
  bot.sendMessage(channelUsername, message, { parse_mode: "HTML" });
};

// 随机预测下一期的数据
const predictNextResult = async (currentPeriod) => {
  const options = ["Red", "Green", "Purple", "Big", "Small"];
  const bs = options[Math.floor(Math.random() * options.length)];

  const indiaTime = await getIndiaTime();
  const formattedDate = moment(indiaTime).format('YYMMDD');
  const lastFourDigits = parseInt(currentPeriod.slice(-4));
  let newPeriod;
  if (lastFourDigits === 1440) {
    newPeriod = `${formattedDate}0001`;
  } else {
    newPeriod = String(parseInt(currentPeriod) + 1);
  }
  return {
    period: newPeriod,
    bs: bs,
    predictOutcome: "",
  };
};

// 更新预测结果
const updateForecastResults = async (data) => {
  try {
    if (!gameResults.length) {
      console.error("gameResults 数组为空");
      return;
    }
    const gameResult = gameResults.find(result => result.period === data.period);
    if (gameResult) {
      const openNum = data.open_num[0];
      let result = "LOSE";
      if (gameResult.bs === "Red" && [0, 2, 4, 6, 8].includes(openNum)) {
        result = "WIN";
      } else if (gameResult.bs === "Green" && [1, 3, 5, 7, 9].includes(openNum)) 
      {
        result = "WIN";
      } else if (gameResult.bs === "Purple" && [0, 5].includes(openNum)) {
        result = "WIN";
      } else if (gameResult.bs === "Big" && openNum >= 5) {
        result = "WIN";
      } else if (gameResult.bs === "Small" && openNum <= 4) {
        result = "WIN";
      }
      gameResult.predictOutcome = result;
    }
  } catch (error) {
    console.error("更新出错:", error);
  }
};

// 格式化消息
const formatMessage = (results) => {
  results.sort((a, b) => parseInt(a.period) - parseInt(b.period));

  statistics.totalPredictions++; 
  if (results.length >= 2) {
    const secondLastOutcome = results[results.length - 2].predictOutcome;
      if (secondLastOutcome === 'LOSE') {
      statistics.losses++;
    } else if (secondLastOutcome === 'WIN') {
      statistics.wins++;
    }
  }

  let message = "🔹TRX dominates the game!🔸\n============\n🥇TRX - WIN 1️⃣ Min - TC🥇\n============\n";


  results.forEach((result) => {
    if (result.period) {
      const outcome = result.predictOutcome
      ? result.predictOutcome === "WIN"
        ? "✅"
        : result.predictOutcome === "LOSE"
        ? "❌"
        : ` ${result.predictOutcome}`
      : "⏳";

      const period = result.period;
      message += `${period} 1 MIN【${outcome}】${result.bs.toUpperCase()}\n`;
    } else {
      console.error("result.period 未定义结果:", result);
    }
  });

  message += `============\n✅Maintain your funds 6-7 level✅ \n======================\n🔹Official TC site link 🔷\n======================\n📌<a href="https://tcvvip.com">tcvvip.com</a>\n`;

  message += `\n⭐️ Today's statistics：\n✅ ${statistics.wins}【Accuracy rate ${(statistics.wins / (statistics.totalPredictions-1) * 100).toFixed(2)}%】\n❌ ${statistics.losses} 【Error rate ${(statistics.losses / (statistics.totalPredictions-1) * 100).toFixed(2)}%】`;
  return message;
};

export { sendResults_trxvngo1 };
