import dotenv from "dotenv";
import app from "./src/server.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

  if(process.env.isProd == "true"){
    console.log(`🚀 Production Server running on ${PORT}`);
  }else{
    console.log(`🚀 Local Server running on ${PORT}`);
  }

});
