import express from 'express';
import axios from 'axios';

const app = express();
const port = 3000;

app.use(axios);


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
})