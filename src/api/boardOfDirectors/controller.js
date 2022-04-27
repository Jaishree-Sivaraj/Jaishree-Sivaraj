import {success, notFound} from '../../services/response/';
import {BoardOfDirectors} from '.';

export const createDirector = async ({bodymen: {body}}, res, next) => {
  let checkDirectorDin = await BoardOfDirectors.find ({din: body.din});
  try {
    if (checkDirectorDin.length > 0) {
      return res.status (402).json ({
        message: 'DIN already exists',
      });
    } else {
      if (body.din != '') {
        await BoardOfDirectors.create ({
          din: body.din,
          name: body.name,
          gender: body.gender,
          companies: body.companies,
        });
        return res.status (200).json ({
          message: 'Board Of Director created successfully',
        });
      }
    }
  } catch (error) {
    return res.status (500).json ({
      message: error.message,
      status: 500,
    });
  }
};

export const index = ({querymen: {query, select, cursor}}, res, next) =>
  BoardOfDirectors.count (query)
    .then (count =>
      BoardOfDirectors.find (query)
        .sort ({createdAt: -1})
        .then (boardDirectors => {
            let directorObjects = [];
            if (boardDirectors.length > 0) {
                boardDirectors.forEach(obj => {
                 directorObjects.push({_id: obj._id, din: obj.din, name: obj.name, gender: obj.gender,companies: obj.companies, createdAt: obj.createdAt});
              })        
            }
         return (directorObjects);
        })
    )
    .then (success (res))
    .catch (next);

export const getDirector = ({params}, res, next) =>
BoardOfDirectors.findById (params.id)
    .populate ('din')
    .then(notFound(res))
    .then (boardDirectors => {
        return ({
          rows: boardDirectors,
        });
      })
    .then (success (res))
    .catch (next);
