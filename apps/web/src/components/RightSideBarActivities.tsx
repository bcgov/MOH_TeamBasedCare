import {  useEffect, useState } from 'react';
import { Checkbox } from '@components'
import _ from 'lodash';
import dataObj from "../common/careActivites.json";
import { useFormikContext } from "formik";

export const RightSideBarActivites: React.FC = () => {
    const [searchValue, setSearchValue]: [string, (search: string) => void] = useState("");
    const { values } = useFormikContext();
    const [items, setItems] = useState();

    //useEFFECTS
    useEffect(() => {
        const newCareActivity = _.find(dataObj.result, function(o) { return o.id == values.careActivityID }) ;
        setItems(newCareActivity)
        //Set checked ids to previously selected ids when care activity changes
        values.checked = _.filter(values.careActivityBundle[values.careActivityID])
    }, [values.careActivityID])

    useEffect(() => {
        values.careActivityBundle[values.careActivityID] = values.checked;
    }, [values.checked])


    // Get search value
    const handleSearch = (e: { target: { value: string; }; }) => {
        setSearchValue(e.target.value);
    };
    // Filter data with search value
    const filteredData = items && items.careActivities.filter(item => {
        return item.name.toLowerCase().includes(searchValue.toLowerCase())
    });

    const arr = items && items.careActivities.filter(item => {
        const a = []
        return item.id;
    });

    // Get search value
    const handleSearchAll = (e) => {
        const arr = [];
        console.log("++++++++ handleSearchAll", e.target.checked)
        if( e.target.checked ) {
            _.each(items.careActivities, item => {
                values.checked.push(item.id);
            })
            // values.checked = arr;
        }else {
            values.checked = [];
        }

        console.log("++++++++ values.checked", values.checked)
        //values.checked = arr;
        
    };

    return (
        <div className='w-2/3 ml-4 mt-4 border-2 border-gray-200 p-4'>
            <div className="justify-between text-bcBluePrimary w-full items-center mb-4 border-b-2 border-gray-200 pb-4">
                <label>
                    <input type="checkbox" name="selectAll" className="mr-3" onChange={handleSearchAll}/>
                    Select all
                </label>
            </div>
           
            <input
                type="text"
                name="search"
                placeholder="Search "
                className="block w-full text-sm text-slate-500 border-2 border-gray-200 p-2"
                value={searchValue}
                onChange={handleSearch}
            />

           <p className="text-sm text-gray-400">{items && items.careActivities.length} Care Activities Tasks and Restricted Tasks</p>
         
            <div className="mt-4" role="group" aria-labelledby="checkbox-group" style={{overflow: "auto", maxHeight: "400px"}}>
                { !_.isEmpty(filteredData) ?
                    filteredData && filteredData.map((item) => {
                            return (
                                <div key={item.id} >
                                    <Checkbox name="checked" value={item.id} label={item.name} />
                                </div>
                            );
                        })
                    : <p className='text-center text-sm mt-4'>No available Care Activity Tasks.</p>
                }
            </div>
        </div>
    );
};