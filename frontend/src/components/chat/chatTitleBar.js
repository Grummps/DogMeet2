import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch as searchIcon } from "@fortawesome/free-solid-svg-icons";
import { faClose as closeIcon } from "@fortawesome/free-solid-svg-icons";
import { faEdit as createMessageIcon } from "@fortawesome/free-solid-svg-icons";
import { faAngleLeft as backIcon } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

const ChatTitleBar = ({
    user,
    chatUser,
    currentTab,
    TABS,
    setSearchInput,
    handleSearchClose,
    handleSearchUser,
    handleChatBackClick,
    toggleChat,
    defaultProfileImageUrl,
}) => {
    const navigate = useNavigate();

    return (
        <div>
            {/* Search Tab Title Bar*/}
            {currentTab === TABS.search && (
                <div className="flex justify-between items-center py-1 border-b border-white font-title">
                    <input
                        className="bg-transparent text-white border-1 px-2 rounded font-title w-full h-10 ml-3 border-white"
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Search for friends..."
                        autoFocus={true}
                    />
                    {/* Close Search pop up  */}
                    <FontAwesomeIcon
                        onClick={handleSearchClose}
                        className="h-6 p-3  hover:text-orange-500 text-white cursor-pointer"
                        icon={closeIcon}
                    />
                </div>
            )}
            {/* Chat Tab Title Bar*/}
            {currentTab === TABS.chat && (
                <div className="flex justify-start items-center p-3 border-b border-white font-title">
                    {/* Back Button  */}
                    <div className="flex justify-center">
                        <FontAwesomeIcon
                            onClick={handleChatBackClick}
                            className="h-5 my-auto mr-5 hover:text-orange-500 text-white cursor-pointer"
                            icon={backIcon}
                        />
                    </div>

                    {/* Chat User Profile Image */}
                    <img
                        src={chatUser.image || defaultProfileImageUrl}
                        alt="Profile Image"
                        className="h-9 w-9 rounded-full bg-white cursor-pointer mr-2"
                        onClick={() => {
                            chatUser._id === user._id
                                ? navigate("/profile")
                                : navigate(`/profile/${chatUser._id}`);
                        }}
                    />
                    {/* Chat Username */}
                    <a
                        href={`/profile/${chatUser._id}`}
                        className="font-title font-bold text-lg no-underline text-white hover:text-orange-500 w-60 truncate overflow-hidden whitespace-nowrap"
                    >
                        @{chatUser.username}
                    </a>
                </div>
            )}
            {/* Chat History Title Bar*/}
            {currentTab === TABS.history && (
                <div className="flex justify-between items-center p-3 border-b border-gray-400 font-title">
                    {/* Chat User Profile Image */}
                    <span className="flex items-center">
                        <img
                            src={user.image || defaultProfileImageUrl}
                            alt="Profile Image"
                            className="h-9 w-9 rounded-full bg-white cursor-pointer mr-2"
                            onClick={() => {
                                navigate("/profile");
                            }}
                        />
                        {/* Username */}
                        <a
                            href={"/profile"}
                            className="font-title font-bold text-lg no-underline text-white hover:text-orange-500 w-48 truncate overflow-hidden whitespace-nowrap"
                        >
                            @{user.username}
                        </a>
                    </span>
                    <div className="flex justify-center">
                        {/* Create Chat  */}
                        <FontAwesomeIcon
                            onClick={handleSearchUser}
                            className="h-5 my-auto mr-5 hover:text-orange-500 text-white cursor-pointer"
                            icon={createMessageIcon}
                        />

                        {/* Close Chat pop up  */}
                        <FontAwesomeIcon
                            onClick={toggleChat}
                            className="h-6 hover:text-orange-500 text-white cursor-pointer"
                            icon={closeIcon}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatTitleBar;
