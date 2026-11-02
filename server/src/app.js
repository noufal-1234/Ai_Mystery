import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import {fileURLToPath} from 'node:url';
import caseRoutes from './routes/caseRoutes.js';
import {session} from './middleware/session.js';

const app=express();
const uploadsDir=process.env.UPLOADS_DIR||fileURLToPath(new URL('../uploads/',import.meta.url));
const clientDist=fileURLToPath(new URL('../../client/dist/',import.meta.url));
app.disable('x-powered-by');
app.use(helmet({contentSecurityPolicy:{directives:{...helmet.contentSecurityPolicy.getDefaultDirectives(),'style-src':["'self'","'unsafe-inline'",'https://fonts.googleapis.com'],'style-src-attr':["'unsafe-inline'"],'font-src':["'self'",'https://fonts.gstatic.com','data:'],'img-src':["'self'",'data:','https:']}}}));
app.use(cors({origin:process.env.CLIENT_URL||'http://localhost:5173',credentials:true}));
app.use(express.json({limit:'32kb'}));
app.use(cookieParser(process.env.SESSION_SECRET));
app.use('/media',express.static(uploadsDir,{maxAge:'7d',immutable:true}));
app.use('/api/v1',session);
app.use('/api/v1',rateLimit({windowMs:15*60*1000,limit:120,standardHeaders:true,legacyHeaders:false}));
app.get('/api/v1/health',(_req,res)=>res.json({success:true,data:{status:'ok'}}));
app.use('/api/v1/cases',caseRoutes);
if(process.env.NODE_ENV==='production'){
 app.use(express.static(clientDist,{index:false, maxAge:'1h'}));
 app.get('*',(req,res,next)=>{
  if(req.path.startsWith('/api/')||req.path.startsWith('/media/'))return next();
  res.sendFile(fileURLToPath(new URL('../../client/dist/index.html',import.meta.url)),error=>error&&next(error));
 });
}
app.use((_req,res)=>res.status(404).json({success:false,message:'Route not found.',error:{code:'NOT_FOUND'}}));
app.use((err,_req,res,_next)=>{
 console.error(err);
 const status=err.status||500;
 res.status(status).json({success:false,message:status<500?err.message:'The server could not complete this request.',error:{code:err.code||'INTERNAL_ERROR'}});
});
export default app;
