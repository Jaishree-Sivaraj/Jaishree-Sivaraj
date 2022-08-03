export function structuredData(resourceDetails,url,i){
    return{
      id:resourceDetails[i]?.id,
      name:resourceDetails[i]?.name,
      file:{
         uid:i,
         name:resourceDetails[i]?.file.name,
         url:url,
      },
      accessibleFor:resourceDetails[i]?.accessibleFor
    }
   }