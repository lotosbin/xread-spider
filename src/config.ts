// noinspection TypeScriptValidateJSTypes
require('dotenv').config();

interface TConfig {
    endpoint: string
}

const config: TConfig = {
    endpoint: process.env.API_URL || ""
};
export default config;
