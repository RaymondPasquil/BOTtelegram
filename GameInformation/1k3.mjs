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
    const response = await axios.get('http://worldtimeapi.org/api/timezone/Asia/Kolkata');
    console.log(response.data.datetime);
    return response.data.datetime;
  } catch (error) {
    console.error('获取印度时间时出错:', error);
    return moment().tz("Asia/Kolkata").format(); // 作为备用，使用本地时间
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
    resetStatistics()
  }

  const formattedDate = currentDate.format('YYYY-MM-DD');

  try {
    const response = await axios.get(url, {
      params: {
        game: "1k3",
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
const sendResults_1k3 = async (bot) => {
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
  const nextPrediction = predictNextResult(latestPeriod);

  if (!gameResults.some((result) => result.period === nextPrediction.period)) {
    gameResults.push(nextPrediction);
    if (gameResults.length > 10) {
      gameResults.shift();
    }
  }



  const message = formatMessage(gameResults);
  bot.sendMessage(channelUsername, message, { parse_mode: "HTML" });
};

const predictNextResult = (currentPeriod) => {
  const options = ["odd", "Big", "Small", "EVEN"];
  const bs = options[Math.floor(Math.random() * options.length)];
  return {
    period: String(parseInt(currentPeriod) + 1).padStart(currentPeriod.length, '0'),
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
      const openNums = data.open_num.slice(0, 3);
      const sum = openNums.reduce((acc, num) => acc + num, 0);
      let result = "LOSE";

      if (gameResult.bs === "Big" && sum >= 11 && sum <= 18) {
        result = "WIN";
      } else if (gameResult.bs === "Small" && sum >= 3 && sum <= 10) {
        result = "WIN";
      } else if (gameResult.bs === "odd" && sum % 2 !== 0) {
        result = "WIN";
      } else if (gameResult.bs === "EVEN" && sum % 2 === 0) {
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

  let message = `🎰 K3-1Min at TC LOTTERY🎰 \nROLL THE DICE TO VICTORY! 🌟 \n============\n🎲 K3 - 1️⃣ Min - TC LOTTERY 🎲\n============\n`;
 
 

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

  message += `============\n✨Maintain your funds 6-7 level✨\n============\n🔸Official TC Lottery link 🔶\n📌<a href="https://tcvvip.com">tcvvip.com</a>`;
 
  message += `\n⭐️ Today's statistics：\n✅ ${statistics.wins}【Accuracy rate ${(statistics.wins / (statistics.totalPredictions-1) * 100).toFixed(2)}%】\n❌ ${statistics.losses} 【Error rate ${(statistics.losses / (statistics.totalPredictions-1) * 100).toFixed(2)}%】`;

  return message;
};

export { sendResults_1k3 };
