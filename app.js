import express from 'express';
import driversRouter from './routes/drivers.js';
import teamsRouter from './routes/teams.js';
import morgan from 'morgan';

const app = express();
const port = 3000;

// Set EJS as the view engine
app.set("view engine", "ejs");

// middlewares
app.use(express.static("src"));
app.use(morgan("dev"));

// middleware to turn off caching
app.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});

// Use routes
app.use("/drivers", driversRouter);
app.use("/teams", teamsRouter);

// Default route
app.get("/", (req, res) => {
    res.render("home.ejs");
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
}); 