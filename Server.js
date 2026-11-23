
const express = require("express");
const pool = require("./Backend_Server/DatabaseParametre/databaseConnection");

const app = express();

app.use(express.json());

app.get("/api/test-db", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM users "
        );


        res.json({
            message: "Connexion PostgreSQL réussie !",
            data: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Erreur de connexion à PostgreSQL"
        });
    }
});

app.listen(3000, () => {
    console.log("Serveur démarré sur http://localhost:3000");
});
