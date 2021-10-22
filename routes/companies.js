const express = require("express");
const router = express.Router()
const db = require('../db');
const ExpressError = require("../expressError");



router.get('/', async function(req, res, next) {
    try {
        const results = await db.query(`SELECT * FROM companies`);

        return res.json({companies: results.rows});
    } catch (err) {
        return next(err);
    }
})

router.get('/:code', async function(req, res, next) {
    try {
        const { code } = req.params;
        const results = await db.query(`SELECT * FROM companies WHERE code=$1`, [code]);

        const invoiceResults = await db.query(`SELECT id FROM invoices WHERE comp_code=$1`, [code]);
        const invoices = invoiceResults.rows;

        if (results.rows.length === 0) {
            throw new ExpressError(`Can't find company with code of ${code}`, 404);
        }

        const company = results.rows[0];

        company.invoices = invoices.map(inv => inv.id);

        return res.json({company: company})
    } catch (err) {
        return next(err);
    }
})

router.post('/', async function(req, res, next) {
    try {
        const {code, name, description} = req.body;
        const results = await db.query(`INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description`, [code, name, description]);
        return res.status(201).json({company: {code, name, description}});
    } catch (err) {
        return next(err);
    }
})

router.put('/:code', async function(req, res, next) {
    try {
        const {code} = req.params;
        const {name, description} = req.body;
        const results = await db.query('UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description', [name, description, code]);
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't update company with code of ${code}`, 404);
        }
        return res.send({company: results.rows[0]});
    } catch (err) {
        return next(err);
    }
})

router.delete('/:code', async function(req, res, next) {
    try {
        const results = db.query('DELETE FROM companies WHERE code=$1', [req.params.code]);
        return res.send({status: 'Deleted'});
    } catch (err) {
        return next(err);
    }
})

module.exports = router;