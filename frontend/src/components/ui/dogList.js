// Unlike dogform, this component gathers a list of other user's dogs
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDog } from '@fortawesome/free-solid-svg-icons';
import React from 'react';

const ListDogs = ({ user }) => (
    <div>
        <h2 className="mt-36 text-xl font-bold mb-4">{user.username}'s Dogs:</h2>
        {user.dogId && user.dogId.length > 0 ? (
            <ul>
                {user.dogId.map(dog => (
                    <li key={dog.id} className="mb-4">
                        <div className="flex items-center">
                            {dog.image ? (
                                <img
                                    src={dog.image}
                                    alt={dog.dogName}
                                    className="w-16 h-16 rounded-full mr-4"
                                />
                            ) : (
                                <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mr-2">
                                    <FontAwesomeIcon icon={faDog} className="size-12" />
                                </div>
                            )}
                            <div>
                                <p className="font-semibold">{dog.dogName}</p>
                                <p className="text-gray-600 text-sm">Size: {dog.size}</p>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        ) : (
            <p>{user.username} has not added any dogs yet.</p>
        )}
    </div>
);

export default ListDogs;
