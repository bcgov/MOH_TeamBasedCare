import {  useState } from 'react';
import { Checkbox } from '@components'
import _ from 'lodash';
import dataObj from "../common/careActivites.json";

export interface RightSideBarActivitesProps {
    title?: string;
}

export const RightSideBarActivites: React.FC<RightSideBarActivitesProps> = ({ title }) => {
    const [items] = useState(_.find(dataObj.result, function(o) { return o.id == "3dd33805-a813-4cab-8576-e06355f16074" })  );
    const [selectedItems, setSelectedItems] = useState([]);
    const [searchValue, setSearchValue]: [string, (search: string) => void] = useState("");

    // Get search value
    const handleSearch = (e: { target: { value: string; }; }) => {
        setSearchValue(e.target.value);
    };
    // Filter data with search value
    const filteredData = items && items.careActivities.filter(item => {
        return item.name.toLowerCase().includes(searchValue.toLowerCase())
    });

    return (
        <div className='w-2/3 ml-4 mt-4 border-2 border-gray-200 p-4'>
            <div className="justify-between text-bcBluePrimary w-full items-center mb-4 border-b-2 border-gray-200 pb-4">
                <Checkbox name="selectAll" label="Select All" />
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

            <div className="mt-4" style={{overflow: "auto", maxHeight: "400px"}}>
                { !_.isEmpty(filteredData) ?
                    filteredData && filteredData.map((item, index) => {
                            return (
                                <Checkbox key={item.id} name={item.name} label={item.name} />
                            );
                        })
                    : <p className='text-center text-sm mt-4'>No available Care Activity Tasks.</p>
                }
            </div>
        </div>
    );
};