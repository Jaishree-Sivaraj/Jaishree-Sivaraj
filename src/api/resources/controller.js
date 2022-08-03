import { success, notFound } from '../../services/response/'
import { Resources } from '.'
import { storeFileInS3, fetchFileFromS3 } from "../../services/utils/aws-s3"
import { structuredData } from './resource-helper-function'

export const create = async (req, res) => {
  const { body } = req;
  const { file } = body;
  const url = file?.base64
  let resourceFileType = url?.split(';')[0]?.split('/')[1];
  let resourceFileName = body?.name + new Date().getTime() + '.' + resourceFileType;
  await storeFileInS3(process.env.SCREENSHOT_BUCKET_NAME, resourceFileName, url)
  await Resources.create(body)
    .then((resources) => {
      const resource = {
        name: resources?.name,
        file: resourceFileName,
        accessibleFor: resources?.accessibleFor
      }
      return res.status(200).json({
        status: "200",
        data: resources
      })
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ message: error.message ? error.message : "Failed to add" })
    })
}

export const index = async (req, res) => {
  try {
    const resourceDetails = await Resources.find({ status: true })
    let resourceList = [];
    for (let i = 0; i < resourceDetails?.length; i++) {
      const fileName = resourceDetails[i]?.file?.name
      const url = await fetchFileFromS3(process.env.SCREENSHOT_BUCKET_NAME, fileName);
      const structure = structuredData(resourceDetails, url, i)
      resourceList.push(structure)
    }
    return res.status(200).json({
      status: "200",
      resourceList
    })

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message ? error.message : 'Failed to fetch!' })
  }

}


export const show = ({ params }, res, next) =>
  Resources.findById(params.id)
    .then(notFound(res))
    .then((resources) => resources ? resources.view() : null)
    .then(success(res))
    .catch(next)


// export const update = ({ body, params }, res, next) =>
//   Resources.findById(params.id)
//     .then(notFound(res))
//     .then((resources) => resources ? Object.assign(resources, body).save() : null)
//     .then((resources) => resources ? resources.view(true) : null)
//     .then(success(res))
//     .catch(next)

export const update = async (req, res) => {
  try {
    const results = await Resources.findByIdAndUpdate(req.params.id, req.body, { new: true, useFindAndModify: false })
    if (!results) {
      return res.status(409).json({ message: 'Failed to update the resources details' })
    }
    return res.status(200).json({
      status: "200",
      message: "Updated successfully",
      data: results
    })
  } catch (error) {
    console.error(error);
   return res.status(409).json({ message: error.message ? error ?.message :'Failed to update the resources details' })
  }
}

// export const destroy = ({ params }, res, next) =>
//   Resources.findById(params.id)
//     .then(notFound(res))
//     .then((resources) => resources ? resources.remove() : null)
//     .then(success(res, 204))
//     .catch(next)

export const destroy = async (req, res) => {
  try {
    const results = await Resources.findOneAndDelete({_id:req.params.id},{$set:{status:false}})
    if(!results){
      return res.status(409).json({ message: 'Failed to delete the resources details' })
    }
    return res.status(200).json({
      status: "200",
      message: "Deleted successfully",
      data: results
    })
  } catch (error) {
    console.error(error);
    return res.status(409).json({ message: error.message ? error?.message :'Failed to delete the resources details' })
  }
}