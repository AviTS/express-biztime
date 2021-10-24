const express = require("express");
const router = express.Router()
const db = require('../db');
const ExpressError = require("../expressError");

router.get('/', async function(req, res, next) {
    try {
        const results = await db.query(`SELECT * FROM invoices`);
        return res.json({invoices: results.rows});
    } catch (err) {
        return next(err);
    }
})

router.get('/:id', async function(req, res, next) {
    try {
        const {id} = req.params;
        const results = await db.query(`SELECT * FROM invoices WHERE id=$1`, [id])
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't find invoice with id of ${id}`, 404);
        }
        return res.send({invoice: results.rows[0]});
    } catch (err) {
        return next(err);
    }
})

router.post('/', async function(req, res, next) {
    try {
        const {comp_code, amt} = req.body;
        const results = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt`, [comp_code, amt]);
        return res.status(201).json({invoice: results.rows[0]})
    } catch (err) {
        return next(err);
    }
})

router.put('/:id', async function(req, res, next) {
    try {
        const {id} = req.params;
        const {amt, paid} = req.body;
        let datePaid = null;

        const checkResults = await db.query(`SELECT paid FROM invoices WHERE id=$1`, [id]);

        if(checkResults.rows.length === 0) {
            throw new ExpressError(`Invoice ${id} doesn't exist.`, 404);
        }

        const paidDate = checkResults.rows[0].paid_date;

        if(!paidDate && paid) {
            datePaid = new Date();
        } else if (!paid) {
            datePaid = null;
        } else {
            datePaid = paidDate; 
        }

        const results = await db.query(`UPDATE invoices SET amt=$1, paid=$2, paid_date=$3 WHERE id=$4 RETURNING id, amt, add_date, paid_date`, [amt, paid, datePaid, id]);

        if (results.rows.length === 0) {
            throw new ExpressError(`Can't update invoice with id of ${id}`, 404);
        }
        return res.send({invoice: results.rows[0]})
    } catch (err) {
        return next(err);
    }
})

router.delete('/:id', async function(req, res, next) {
    try {
        const results = db.query(`DELETE FROM invoices WHERE id=$1`, [req.params.id]);
        return res.send({status: "Deleted"})
    } catch (err) {
        return next(err);
    }
})



module.exports = router;