import {Router} from 'express';
import {z} from 'zod';
import * as controller from '../controllers/caseController.js';
const router=Router();const asyncRoute=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
const generate=z.object({title:z.string().max(80).optional(),story:z.string().trim().min(50).max(2000),difficulty:z.enum(['easy','medium','hard']),suspectCount:z.number().int().min(3).max(6)});
const accusation=z.object({suspectId:z.string().min(1),explanation:z.string().max(1000).optional().default('')});const progress=z.object({type:z.enum(['evidence','suspect']),itemId:z.string().min(1)});
function validate(schema){return(req,res,next)=>{const r=schema.safeParse(req.body);if(!r.success)return res.status(400).json({success:false,message:'Please check the submitted information.',error:{code:'VALIDATION_ERROR',details:r.error.flatten()}});req.body=r.data;next()}}
router.post('/generate',validate(generate),asyncRoute(controller.create));router.get('/:caseId',asyncRoute(controller.getCase));router.get('/:caseId/suspects/:suspectId',asyncRoute(controller.getSuspect));router.get('/:caseId/evidence',asyncRoute(controller.listEvidence));router.get('/:caseId/evidence/:evidenceId',asyncRoute(controller.getEvidence));router.post('/:caseId/progress',validate(progress),asyncRoute(controller.progress));router.post('/:caseId/accusation',validate(accusation),asyncRoute(controller.accuse));export default router;
