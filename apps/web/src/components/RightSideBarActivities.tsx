import {  useState } from 'react';
import { Checkbox } from '@components'
import _ from 'lodash';

export const dataRight =[
    { label: "Inspect, clean and moisturize skin", name:"name1"},
    { label: "Mouth care", name:"name2"},
    { label: "Shave (electric)", name:"name3"},
    { label: "Shave (safety razon)", name:"name4"},
    { label: "Bed bath", name:"name5"},
    { label: "Assist with bathing/changing/personal care/continence & toileting", name:"name6"},
    { label: "Support patient to complete oral care", name:"name7"},
    { label: "Assist/support patient with transfers/ambulation", name:"name8"},
    { label: "Provide thermal regulation", name:"name9"},
    { label: "Provide thermal regulation", name:"name10"},
    { label: "Assess/Leads Turns", name:"name11"},
    { label: "Assist with patient turning/repositioning in bed to prevent pressure ulcers", name:"name12"},
    { label: "Completes mobility screen for ambulation & transfers", name:"name13"},
    { label: "Assess patient with complex mobility", name:"name14"},
    { label: "Support patient to complete oral care", name:"name15"},
    { label: "Assist/support patient with transfers/ambulation", name:"name16"},
    { label: "Provide thermal regulation", name:"name17"},
    { label: "Provide thermal regulation", name:"name18"},
    { label: "Assess/Leads Turns", name:"name19"},
    { label: "Assist with patient turning/repositioning in bed to prevent pressure ulcers", name:"name20"},
    { label: "Completes mobility screen for ambulation & transfers", name:"name21"},
    { label: "Assess patient with complex mobility", name:"name22"},
]

export interface RightSideBarActivitesProps {
    title?: string;
}

export const RightSideBarActivites: React.FC<RightSideBarActivitesProps> = ({ title }) => {
    const [items] = useState(dataRight);
    const [selectedItems, setSelectedItems] = useState([]);
    const [searchValue, setSearchValue]: [string, (search: string) => void] = useState("");

    // Get search value
    const handleSearch = (e: { target: { value: string; }; }) => {
        setSearchValue(e.target.value);
    };
    // Filter data with search value
    const filteredData = items.filter(item => {
        return item.label.toLowerCase().includes(searchValue.toLowerCase())
    });

    const handleSetSelectedItem = (id: number) => {
        setSelectedItems({...selectedItems, id})
    }

    const handleSelectAll = (arr: []) => {
        
    }

    return (
        <div className='w-2/3 ml-4 mt-4 border-2 border-gray-200 p-4'>
            <div className="justify-between w-full items-center mb-4 border-b-2 border-gray-200 pb-4">
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

           <p className="text-sm text-gray-400">{dataRight.length} Care Activities Tasks and Restricted Tasks</p>

            <div className="mt-4" style={{overflow: "auto", maxHeight: "400px"}}>
                { !_.isEmpty(filteredData) ?
                    filteredData.map((item, index) => {
                            return (
                                <Checkbox key={index} name={item.name} label={item.label} />
                            );
                        })
                    : <p className='text-center text-sm mt-4'>No available Care Activity Tasks.</p>
                }
            </div>
        </div>
    );
};