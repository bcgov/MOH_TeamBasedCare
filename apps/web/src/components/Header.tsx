/* This example requires Tailwind CSS v2.0+ */
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faAddressBook } from '@fortawesome/free-solid-svg-icons'

const navigation = [
  { name: 'Dashboard', href: '#', current: true },
  { name: 'Team', href: '#', current: false },
  { name: 'Projects', href: '#', current: false },
  { name: 'Calendar', href: '#', current: false },
]

// function classNames(...classes) {
//   return classes.filter(Boolean).join(' ')
// }
export const Header = () => {
  return ( <>
  

    <header className="flex w-full items-center justify-between border-b-2 border-gray-200 p-4">
        
        <div className="flex items-center space-x-2">
            <h1 className="text-2xl "><FontAwesomeIcon icon={faUsers} className='h-5' />Resourcing</h1>
        </div>

       
        <div className="flex p-2">
            <div className="">
                    <a href="#" className="transition hover:text-blue-600"><FontAwesomeIcon icon={faAddressBook}/></a>
                    <a href="#" className="transition hover:text-blue-600"><FontAwesomeIcon icon={faUsers} className='h-5' /></a>
                    <a href="#" className="transition hover:text-blue-600"><FontAwesomeIcon icon={faUsers} className='h-5' /></a>
                </div>
            <button type="button"
                className="flex h-9 w-9 overflow-hidden rounded-full">
                <img src="https://plchldr.co/i/40x40?bg=111111" alt="plchldr.co" />
            </button>

           
            <div className="absolute hidden right-2 mt-10 w-48 divide-y divide-gray-200 rounded-md border border-gray-200 bg-white shadow-md"
                x-show="profileOpen" x-transition>
                <div className="flex items-center space-x-2 p-2">
                    <img src="https://plchldr.co/i/40x40?bg=111111" alt="plchldr.co" className="h-9 w-9 rounded-full" />
                    <div className="font-medium">Hafiz Haziq</div>
                </div>

                <div className="flex flex-col space-y-3 p-2">
                    <a href="#" className="transition hover:text-blue-600">My Profile</a>
                    <a href="#" className="transition hover:text-blue-600">Edit Profile</a>
                    <a href="#" className="transition hover:text-blue-600">Settings</a>
                </div>

                <div className="p-2">
                    <button className="flex items-center space-x-2 transition hover:text-blue-600">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1">
                            </path>
                        </svg>
                        <div>Log Out</div>
                    </button>
                </div>
            </div>
        </div>
    </header>
  </>
  )
}
