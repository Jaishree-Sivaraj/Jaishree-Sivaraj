import { success, notFound } from '../../services/response/'
import { SourceTypes } from '.'
import {SourceSubTypes} from '../source_sub_types' 

export const create = ({ bodymen: { body } }, res, next) =>
  SourceTypes.create(body)
    .then((sourceTypes) => sourceTypes.view(true))
    .then(success(res, 201))
    .catch(next)

export const index = async({ querymen: { query, select, cursor } }, res, next) =>
  await SourceTypes.find({status: true})
    .populate('sourceSubTypeId')
      .then(async(sourceTypes) => {
        if (sourceTypes && sourceTypes.length > 0) {
          let sourceTypesList = [];
          for (let index = 0; index < sourceTypes.length; index++) {
            let sourceTypeObject = {
              value: sourceTypes[index].id,
              label: sourceTypes[index].typeName,
              isMultiYear: sourceTypes[index].isMultiYear,
              isMultiSource: sourceTypes[index].isMultiSource,
              subSourceTypes: []
            }
            if (sourceTypes[index].typeName == 'Policy documents') {
              await SourceSubTypes.find({status: true})
              .then((allSubTypes) => {
                if (allSubTypes && allSubTypes.length > 0) {
                  for (let sIndex = 0; sIndex < allSubTypes.length; sIndex++) {
                    let subSourceObject = {
                      value : allSubTypes[sIndex].id,
                      label : allSubTypes[sIndex].subTypeName
                    }
                    sourceTypeObject.subSourceTypes.push(subSourceObject);
                  }
                }
              })
              .catch((error) => { return res.status(500).json({ status: "500", message: "Sub sourcetype not found!" }); });
            }else if (sourceTypes[index].typeName == 'Webpages' || sourceTypes[index].typeName == 'News' || sourceTypes[index].typeName == 'Press release' || sourceTypes[index].typeName == 'Meeting Notice & Vote results') {
              await SourceSubTypes.find({subTypeName: "Others"})
              .then((allSubTypes) => {
                if (allSubTypes && allSubTypes.length > 0) {
                  for (let sIndex = 0; sIndex < allSubTypes.length; sIndex++) {
                    let subSourceObject = {
                      value : allSubTypes[sIndex].id,
                      label : allSubTypes[sIndex].subTypeName
                    }
                    sourceTypeObject.subSourceTypes.push(subSourceObject);
                  }
                }
              })
              .catch((error) => { return res.status(500).json({ status: "500", message: "Sub sourcetype not found!" }); });
            }
            sourceTypesList.push(sourceTypeObject);
          }
          return res.status(200).json({ status: "200", message: "Source types retrieved successfully!", data: sourceTypesList });
        }
      }
    )
    .catch((error) => { return res.status(500).json({ status: "500", message: "Failed to retrieve source types!" }); })

export const show = ({ params }, res, next) =>
  SourceTypes.findById(params.id)
    .populate('sourceSubTypeId')
    .then(notFound(res))
    .then((sourceTypes) => sourceTypes ? sourceTypes.view() : null)
    .then(success(res))
    .catch(next)

export const update = ({ bodymen: { body }, params }, res, next) =>
  SourceTypes.findById(params.id)
    .populate('sourceSubTypeId')
    .then(notFound(res))
    .then((sourceTypes) => sourceTypes ? Object.assign(sourceTypes, body).save() : null)
    .then((sourceTypes) => sourceTypes ? sourceTypes.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ params }, res, next) =>
  SourceTypes.findById(params.id)
    .then(notFound(res))
    .then((sourceTypes) => sourceTypes ? sourceTypes.remove() : null)
    .then(success(res, 204))
    .catch(next)
