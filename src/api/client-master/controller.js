import { success, notFound } from '../../services/response/'
import { ClientMaster } from '.';
import { Companies } from '../companies';
import mongoose, { Schema } from 'mongoose';
import { ClientTaxonomy } from '../clientTaxonomy'
import { result } from 'lodash';
import { truncateSync } from 'fs';
import { id } from 'date-fns/locale';


export const create = ({ bodymen: { body } }, res, next) =>
  ClientMaster.create(body)
    .then((clientMaster) => clientMaster.view(true))
    .then(success(res, 201))
    .catch(next)


export const index = async ( res, next) => {
        ClientMaster.find()
        .populate('taxonomy')
        .then(notFound(res))
        .then((clientObj)=>{
          let response=[];
          if (clientObj.length > 0) {
          clientObj.forEach(obj=>{
            response.push({
              _id: obj._id,
                reportsApplicable: obj.reportsApplicable,
                clientId: obj.clientId,
                clientName: obj.clientName,
                status: obj.status,
                taxonomy: [{id:obj.taxonomy.id ,taxonomyName:obj.taxonomy.taxonomyName}],
                //taxonomy:obj.taxonomy,
                country: obj.country,
                createdAt: obj.createdAt,
                updatedAt: obj.updatedAt
            })
           console.log(response)
           
          //  let list=response.taxonomy
          //  console.log(list)
      
          //  let retrieveList=[]
          //  for(let i=0; i< list.length; i++){
          //   let objToPush={
          //        id:list[i].id,
          //        taxonomyName:list[i].taxonomyName
          //   }
          //   retrieveList.push(objToPush)
          //  }
          //  console.log(retrieveList)
            // let responseObject = {
            //     clientRes: response,
            //     taxonomy: [{id:clientObj.taxonomy.id ,taxonomyName:clientObj.taxonomy.taxonomyName}]
            //   }
            //   console.log(responseObject)
            
          //   let retrieveList=[]
          // for (let i = 0; i< response[0].taxonomy; i++) {
          //     let objToPush = {              
          //     // _id: response[i]._id,
          //     taxonomyName: response[i].taxonomyName     
          //   }  
          //   retrieveList.push(objToPush)
            
          // }
             //console.log(response[0].taxonomy)
            // console.log(response.clientName)
            // let taxonomyObj=[]
            //   if(response.length> 0){
            //     response.forEach(obj=>{
            //     response=obj.response.taxonomyName
            //     })
            //     console.log(taxonomyObj)
            //   }
            
            // let responseObject = {
            //   clientRes: response,
            //  // taxonomy: { "id":clientObj.taxonomy.id ,"taxonomyName": clientObj.taxonomy.taxonomyName,}
            // }
            // return (responseObject);
            //console.log(responseObject)
            // console.log(response)
           })
           
          
          }
          }
           
            //console.log(responseObject)
        
        )
      
      
//        const clientMaster = await ClientMaster.find()
//        const client= await ClientTaxonomy.find({})
//          for(let i=0;i<clientMaster.length;i++){
//           let obj={
//              clientId:clientMaster[i].clientId,
//              clientName:clientMaster[i].clientName,
//              status:clientMaster[i].status,
//              country:clientMaster[i].country,
//              taxonomy:client.taxonomy

//     }
//           texonomyObjects.push(obj)
// }
//     console.log(texonomyObjects)
// }
// let texonomyObjects = [];
//       ClientMaster.find()
//         .then(notFound(res))
//         .then((clientObj) => {
//           if (clientObj.length > 0) {
//             clientObj.forEach(obj => {
//               texonomyObjects.push({
//                 _id: obj._id,
//                 reportsApplicable: obj.reportsApplicable,
//                 clientId: obj.clientId,
//                 clientName: obj.clientName,
//                 taxonomy: obj.taxonomy,
//                 status: obj.status,
//                 country: obj.country,
//                 createdAt: obj.createdAt,
//                 updatedAt: obj.updatedAt
//               });
             
//           })
//             console.log()
//        }
          
                 //console.log(texonomyObjects.clientName)
      // const clientDetails=ClientTaxonomy.find({
      //   clientTaxonomyId:{$in:ClientTaxonomy}
      // }).populate('clientTaxonomyId')

          // let response = [];
          // for (let i = 0; i < texonomyObjects.length; i++) {  
          //   ClientTaxonomy.find({_id:texonomyObjects.taxonomy})
          //     .then(result => {
          //       //texonomyObjects[i].taxonomy
          //      response.push(result)
          //     })
          //     console.log(response)
          // }
          // let retrieveList=[]
          // for (let j = 0; j< response.length; j++) {
          //     let objToPush = {              
          //     _id: response[j]._id,
          //     taxonomyName: response[j].taxonomyName     
          //   }  
          //   retrieveList.push(objToPush)
          //   console.log(retrieveList)
          // }
         
          //   return res.status(200).json({ message: "Client Master Retrieved successfully!", data:retrieveList});
          // })
          // .catch(next)

  
   }         
          //   retrieveList.push(objToPush)     
          //   }      
          // for (var i = 0; i < texonomyObjects.length; i++) {
          //   var response = [];
          //   ClientTaxonomy.find( {_id: mongoose.Types.ObjectId(texonomyObjects[i].taxonomy)}, {taxonomyName: mongoose.Types.ObjectId(texonomyObjects[i].taxonomy)})
          //     .then(result => {
          //       console.log(result)
          //      response.push(result)
          //     })
          //     //console.log(response)

          //     let data;
          //     for (var j=0; j<response.length; j++) {
          //     data = {
          //         _id: response[j]._id,
          //         taxonomyName: response[j].taxonomyName
          //       }
          //       //console.log(data)
          //     }
          // }
         
        
           


export const getTexonomy = (req,res, next) =>{
  ClientTaxonomy.find()
  .then(notFound(res))
  .then(result => {
    let texonomyObjects = [];
    if (result.length > 0) {
      result.forEach(obj => {
        texonomyObjects.push({
          _id: obj._id,
          taxonomyName: obj.taxonomyName
        });
      });
    }
    return res.status(200).json({
      message: 'Texonomy List Retrieved successfully',
      status: '200',
      data: texonomyObjects,
    });
  })
  .catch(next)
}

export const show = ({ params }, res, next) =>{
  ClientMaster.find(params.id)
    .then(notFound(res))
    .then((clientMaster) => clientMaster ? clientMaster.view() : null)
    .then(success(res))
    .catch(next)
}

export const update = ({ bodymen: { body }, params }, res, next) =>
  ClientMaster.findById(params.id)
    .then(notFound(res))
    .then((clientMaster) => clientMaster ? Object.assign(clientMaster, body).save() : null)
    .then((clientMaster) => clientMaster ? clientMaster.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ params }, res, next) =>
  ClientMaster.findById(params.id)
    .then(notFound(res))
    .then((clientMaster) => clientMaster ? clientMaster.remove() : null)
    .then(success(res, 204))
    .catch(next)
