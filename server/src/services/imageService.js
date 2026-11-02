import {GoogleGenAI} from '@google/genai';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {v2 as cloudinary} from 'cloudinary';

const uploadDir=process.env.UPLOADS_DIR||fileURLToPath(new URL('../../uploads/',import.meta.url));
export async function generateEvidenceImage(evidence){
 if((process.env.IMAGE_PROVIDER||'gemini')!=='gemini'||!process.env.GEMINI_API_KEY)return {mediaStatus:'descriptive_fallback'};
 const ai=new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY});
 const prompt=`Create a photorealistic fictional evidence photograph for a detective mystery game. No text, labels, graphic violence, or identifiable real people. Muted archival color, natural investigative photography. Depict: ${evidence.content?.visualDetails||evidence.description}.`;
 const response=await ai.models.generateContent({model:process.env.IMAGE_MODEL||'gemini-nano-banana-2.1',contents:prompt,config:{responseModalities:['IMAGE'],imageConfig:{aspectRatio:'4:3'}}});
 const parts=response.candidates?.[0]?.content?.parts||[];const image=parts.find(part=>part.inlineData?.data);
 if(!image)return {mediaStatus:'descriptive_fallback'};
 const buffer=Buffer.from(image.inlineData.data,'base64');
 if(process.env.CLOUDINARY_URL){const mime=image.inlineData.mimeType||'image/png';const uploaded=await cloudinary.uploader.upload(`data:${mime};base64,${buffer.toString('base64')}`,{folder:'ai-mystery-room',resource_type:'image'});return {mediaStatus:'generated',assetUrl:uploaded.secure_url};}
 const ext=(image.inlineData.mimeType||'image/png').includes('jpeg')?'jpg':'png';const filename=`${randomBytes(16).toString('hex')}.${ext}`;
 await mkdir(uploadDir,{recursive:true});await writeFile(path.join(uploadDir,filename),buffer);
 return {mediaStatus:'generated',assetUrl:`/media/${filename}`};
}
