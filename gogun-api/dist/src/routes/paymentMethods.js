"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const response_1 = require("../lib/response");
const router = (0, express_1.Router)({ mergeParams: true });
const gone = (_req, res) => (0, response_1.err)(res, 410, 'GONE', 'Payment methods have been removed from this API version');
router.get('/:userId', gone);
router.put('/', gone);
exports.default = router;
