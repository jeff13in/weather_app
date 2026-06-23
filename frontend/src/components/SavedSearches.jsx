import { useState } from "react";



function SavedSearches({searches, onRefresh}){

    const [editId, setEditId] =useState(null);
    const [editCity, setEditCity] = useState('');
    const [editStart, setEditStart] = useState('');
    const [editEnd, setEditEnd] = useState('');
    const [editError, setEditError] = useState('');




    const handleDelete =async (id) => {
        if(!window.confirm('Delete this record?')) return;

        try{
            const res =await fetch(`http://localhost:3001/api/searches/${id}`,{
                method: 'DELETE'
            });

            if(!res.ok){
                alert('could not delete. try again');
                return;
            }

            onRefresh();
        }
        catch(err){
            alert('could not delete, try again');
        }
    };

    const startEdit = (search) => {
        setEditId(search.id);
        setEditCity(search.city);
        setEditStart(search.start_date || '');
        setEditEnd(search.end_date || '');
        setEditError('');

    };

    const cancelEdit = () =>{
        setEditId(null);
        setEditError('');
    };

    const handleUpdate = async () => {
        if(!editCity.trim()){
            setEditError('city cannot be empty');
            return;
        }
        if(editStart && editEnd && new Date(editStart) > new Date(editEnd)){
            setEditError('start date must be before end date');
            return;
        }

        try{
            const res = await fetch(`http://localhost:3001/api/searches/${editId}`,{
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    city:editCity,
                    start_date: editStart || null,
                    end_date: editEnd || null
                })
            });

            const data = await res.json();

            if (!res.ok) {
                setEditError(data.message);
                return;
            }

            setEditId(null);
            onRefresh();

        }
        catch(err){
            setEditError('update failed, try again');
        }
    };

    if(searches.length === 0){
        return <p style={{ textAlign: 'center', color: '#888', padding: '40px'}}> No saved searches
        </p>;
    }

    return (
        <div>
            <h2>Saved Searches ({searches.length})</h2>

            <div style={{overflowX: 'auto'}}>
                <table className="saved-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>City</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Temp</th>
                            <th>Description</th>
                            <th>Humidity</th>
                            <th>Wind</th>
                            <th>Saved At</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                    {searches.map(s => (
                            <>
                                <tr key={s.id}>
                                    <td>{s.id}</td>
                                    <td>{s.city}, {s.country}</td>
                                    <td>{s.start_date || '—'}</td>
                                    <td>{s.end_date || '—'}</td>
                                    <td>{s.temperature}°F</td>
                                    <td style={{ textTransform: 'capitalize' }}>{s.description}</td>
                                    <td>{s.humidity}%</td>
                                    <td>{s.wind_speed} mph</td>
                                    <td>{new Date(s.saved_at).toLocaleDateString()}</td>
                                    <td>
                                        <button className="btn-edit" onClick={() => startEdit(s)}>Edit</button>
                                        <button className="btn-delete" onClick={() => handleDelete(s.id)}>Delete</button>
                                    </td>
                                </tr>

                                {editId === s.id && (
                                    <tr key={`edit-${s.id}`} style={{ background: '#fffde7' }}>
                                        <td colSpan="10">
                                            <div className="edit-form">
                                                <label>
                                                    City:
                                                    <input
                                                        type="text"
                                                        value={editCity}
                                                        onChange={(e) => setEditCity(e.target.value)}
                                                    />
                                                </label>
                                                <label>
                                                    Start Date:
                                                    <input
                                                        type="date"
                                                        value={editStart}
                                                        onChange={(e) => setEditStart(e.target.value)}
                                                    />
                                                </label>
                                                <label>
                                                    End Date:
                                                    <input
                                                        type="date"
                                                        value={editEnd}
                                                        onChange={(e) => setEditEnd(e.target.value)}
                                                    />
                                                </label>
                                                <button className="btn-blue" onClick={handleUpdate}>Save</button>
                                                <button className="btn-grey" onClick={cancelEdit}>Cancel</button>
                                                {editError && <span className="edit-error">{editError}</span>}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </>
                        ))}
                    </tbody>
                </table>
            </div>
            
        </div>
    );

}

export default SavedSearches;