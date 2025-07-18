const { createClient } = require('@supabase/supabase-js');

// This function will import the entire 2025 game schedule.
exports.handler = async function (event, context) {
  // Initialize Supabase Client from environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Raw game data provided by you
  const gamesRawData = `
season	week	home_team	away_team	DateTime	game_time (YYYY-MM-DD HH:MM:SS)
2025	1	Rutgers	Ohio	8/28/2025 6:00 PM	2025-08-28 18:00:00
2025	1	Minnesota	Buffalo	8/28/2025 8:00 PM	2025-08-28 20:00:00
2025	1	Cincinnati	Nebraska	8/28/2025 9:00 PM	2025-08-28 21:00:00
2025	1	Wisconsin	Miami (OH)	8/28/2025 9:00 PM	2025-08-28 21:00:00
2025	1	Michigan State	Western Michigan	8/29/2025 7:00 PM	2025-08-29 19:00:00
2025	1	Illinois	Western Illinois	8/29/2025 7:30 PM	2025-08-29 19:30:00
2025	1	Ohio State	Texas	8/30/2025 12:00 PM	2025-08-30 12:00:00
2025	1	Maryland	Florida Atlantic	8/30/2025 12:00 PM	2025-08-30 12:00:00
2025	1	Purdue	Ball State	8/30/2025 12:00 PM	2025-08-30 12:00:00
2025	1	Tulane	Northwestern	8/30/2025 12:00 PM	2025-08-30 12:00:00
2025	1	Indiana	Old Dominion	8/30/2025 2:30 PM	2025-08-30 14:30:00
2025	1	Penn State	Nevada	8/30/2025 3:30 PM	2025-08-30 15:30:00
2025	1	Oregon	Montana State	8/30/2025 4:00 PM	2025-08-30 16:00:00
2025	1	Iowa	UAlbany	8/30/2025 6:00 PM	2025-08-30 18:00:00
2025	1	USC	Missouri State	8/30/2025 7:30 PM	2025-08-30 19:30:00
2025	1	Michigan	New Mexico	8/30/2025 7:30 PM	2025-08-30 19:30:00
2025	1	UCLA	Utah	8/30/2025 11:00 PM	2025-08-30 23:00:00
2025	1	Washington	Colorado State	8/30/2025 11:00 PM	2025-08-30 23:00:00
2025	2	Northwestern	Western Illinois	9/5/2025 7:30 PM	2025-09-05 19:30:00
2025	2	Maryland	Northern Illinois	9/5/2025 7:30 PM	2025-09-05 19:30:00
2025	2	Penn State	Florida International	9/6/2025 12:00 PM	2025-09-06 12:00:00
2025	2	Indiana	Kennesaw State	9/6/2025 12:00 PM	2025-09-06 12:00:00
2025	2	Minnesota	Northwestern State	9/6/2025 12:00 PM	2025-09-06 12:00:00
2025	2	Iowa State	Iowa	9/6/2025 12:00 PM	2025-09-06 12:00:00
2025	2	Duke	Illinois	9/6/2025 12:00 PM	2025-09-06 12:00:00
2025	2	Ohio State	Grambling	9/6/2025 3:30 PM	2025-09-06 15:30:00
2025	2	Rutgers	Miami (OH)	9/6/2025 3:30 PM	2025-09-06 15:30:00
2025	2	Oregon	Oklahoma State	9/6/2025 3:30 PM	2025-09-06 15:30:00
2025	2	Wisconsin	Middle Tennessee	9/6/2025 4:00 PM	2025-09-06 16:00:00
2025	2	Oklahoma	Michigan	9/6/2025 7:30 PM	2025-09-06 19:30:00
2025	2	Nebraska	Akron	9/6/2025 7:30 PM	2025-09-06 19:30:00
2025	2	USC	Georgia Southern	9/6/2025 7:30 PM	2025-09-06 19:30:00
2025	2	Michigan State	Boston College	9/6/2025 7:30 PM	2025-09-06 19:30:00
2025	2	Purdue	Southern Illinois	9/6/2025 7:30 PM	2025-09-06 19:30:00
2025	2	UNLV	UCLA	9/6/2025 8:00 PM	2025-09-06 20:00:00
2025	2	Washington	UC Davis	9/6/2025 11:00 PM	2025-09-06 23:00:00
2025	3	Indiana	Indiana State	9/12/2025 TBD	2025-09-12
2025	3	UCLA	New Mexico	9/12/2025 TBD	2025-09-12
2025	3	Alabama	Wisconsin	9/13/2025 12:00 PM	2025-09-13 12:00:00
2025	3	Nebraska	Houston Christian	9/13/2025 12:00 PM	2025-09-13 12:00:00
2025	3	Northwestern	Oregon	9/13/2025 12:00 PM	2025-09-13 12:00:00
2025	3	Maryland	Towson	9/13/2025 12:00 PM	2025-09-13 12:00:00
2025	3	Michigan	Central Michigan	9/13/2025 12:00 PM	2025-09-13 12:00:00
2025	3	Purdue	USC	9/13/2025 3:30 PM	2025-09-13 15:30:00
2025	3	Rutgers	Norfolk State	9/13/2025 3:30 PM	2025-09-13 15:30:00
2025	3	Michigan State	Youngstown State	9/13/2025 3:30 PM	2025-09-13 15:30:00
2025	3	Penn State	Villanova	9/13/2025 3:30 PM	2025-09-13 15:30:00
2025	3	Ohio State	Ohio	9/13/2025 7:00 PM	2025-09-13 19:00:00
2025	3	Illinois	Western Michigan	9/13/2025 7:00 PM	2025-09-13 19:00:00
2025	3	Iowa	Massachusetts	9/13/2025 7:30 PM	2025-09-13 19:30:00
2025	3	California	Minnesota	9/13/2025 10:30 PM	2025-09-13 22:30:00
2025	4	Rutgers	Iowa	9/19/2025 8:00 PM	2025-09-19 20:00:00
2025	4	Oregon	Oregon State	9/20/2025 TBD	2025-09-20
2025	4	Indiana	Illinois	9/20/2025 TBD	2025-09-20
2025	4	Wisconsin	Maryland	9/20/2025 TBD	2025-09-20
2025	4	USC	Michigan State	9/20/2025 TBD	2025-09-20
2025	4	Nebraska	Michigan	9/20/2025 3:30 PM	2025-09-20 15:30:00
2025	4	Notre Dame	Purdue	9/20/2025 3:30 PM	2025-09-20 15:30:00
2025	4	Washington State	Washington	9/20/2025 7:30 PM	2025-09-20 19:30:00
2025	5	Minnesota	Rutgers	9/27/2025 TBD	2025-09-27
2025	5	Illinois	USC	9/27/2025 TBD	2025-09-27
2025	5	Northwestern	UCLA	9/27/2025 TBD	2025-09-27
2025	5	Washington	Ohio State	9/27/2025 TBD	2025-09-27
2025	5	Iowa	Indiana	9/27/2025 TBD	2025-09-27
2025	5	Penn State	Oregon	9/27/2025 7:30 PM	2025-09-27 19:30:00
2025	6	UCLA	Penn State	10/4/2025 TBD	2025-10-04
2025	6	Michigan	Wisconsin	10/4/2025 TBD	2025-10-04
2025	6	Maryland	Washington	10/4/2025 TBD	2025-10-04
2025	6	Northwestern	UL Monroe	10/4/2025 TBD	2025-10-04
2025	6	Ohio State	Minnesota	10/4/2025 TBD	2025-10-04
2025	6	Nebraska	Michigan State	10/4/2025 TBD	2025-10-04
2025	6	Purdue	Illinois	10/4/2025 TBD	2025-10-04
2025	7	Washington	Rutgers	10/10/2025 9:00 PM	2025-10-10 21:00:00
2025	7	Minnesota	Purdue	10/11/2025 TBD	2025-10-11
2025	7	Illinois	Ohio State	10/11/2025 TBD	2025-10-11
2025	7	Penn State	Northwestern	10/11/2025 TBD	2025-10-11
2025	7	Maryland	Nebraska	10/11/2025 TBD	2025-10-11
2025	7	USC	Michigan	10/11/2025 TBD	2025-10-11
2025	7	Wisconsin	Iowa	10/11/2025 TBD	2025-10-11
2025	7	Oregon	Indiana	10/11/2025 TBD	2025-10-11
2025	7	Michigan State	UCLA	10/11/2025 12:00 PM	2025-10-11 12:00:00
2025	8	Minnesota	Nebraska	10/17/2025 8:00 PM	2025-10-17 20:00:00
2025	8	Michigan	Washington	10/18/2025 TBD	2025-10-18
2025	8	Northwestern	Purdue	10/18/2025 TBD	2025-10-18
2025	8	Iowa	Penn State	10/18/2025 TBD	2025-10-18
2025	8	Rutgers	Oregon	10/18/2025 TBD	2025-10-18
2025	8	Wisconsin	Ohio State	10/18/2025 TBD	2025-10-18
2025	8	Indiana	Michigan State	10/18/2025 TBD	2025-10-18
2025	8	UCLA	Maryland	10/18/2025 TBD	2025-10-18
2025	8	Notre Dame	USC	10/18/2025 7:30 PM	2025-10-18 19:30:00
2025	9	Washington	Illinois	10/25/2025 TBD	2025-10-25
2025	9	Michigan State	Michigan	10/25/2025 TBD	2025-10-25
2025	9	Iowa	Minnesota	10/25/2025 TBD	2025-10-25
2025	9	Nebraska	Northwestern	10/25/2025 TBD	2025-10-25
2025	9	Purdue	Rutgers	10/25/2025 TBD	2025-10-25
2025	9	Indiana	UCLA	10/25/2025 TBD	2025-10-25
2025	9	Oregon	Wisconsin	10/25/2025 TBD	2025-10-25
2025	10	Maryland	Indiana	11/1/2025 TBD	2025-11-01
2025	10	Minnesota	Michigan State	11/1/2025 TBD	2025-11-01
2025	10	Ohio State	Penn State	11/1/2025 TBD	2025-11-01
2025	10	Michigan	Purdue	11/1/2025 TBD	2025-11-01
2025	10	Illinois	Rutgers	11/1/2025 TBD	2025-11-01
2025	10	Nebraska	USC	11/1/2025 TBD	2025-11-01
2025	11	USC	Northwestern	11/7/2025 9:00 PM	2025-11-07 21:00:00
2025	11	Penn State	Indiana	11/8/2025 TBD	2025-11-08
2025	11	Rutgers	Maryland	11/8/2025 TBD	2025-11-08
2025	11	UCLA	Nebraska	11/8/2025 TBD	2025-11-08
2025	11	Purdue	Ohio State	11/8/2025 TBD	2025-11-08
2025	11	Iowa	Oregon	11/8/2025 TBD	2025-11-08
2025	11	Wisconsin	Washington	11/8/2025 TBD	2025-11-08
2025	12	Oregon	Minnesota	11/14/2025 9:00 PM	2025-11-14 21:00:00
2025	12	Ohio State	UCLA	11/15/2025 TBD	2025-11-15
2025	12	Indiana	Wisconsin	11/15/2025 TBD	2025-11-15
2025	12	Washington	Purdue	11/15/2025 TBD	2025-11-15
2025	12	Michigan State	Penn State	11/15/2025 TBD	2025-11-15
2025	12	Northwestern	Michigan	11/15/2025 TBD	2025-11-15
2025	12	Illinois	Maryland	11/15/2025 TBD	2025-11-15
2025	12	USC	Iowa	11/15/2025 TBD	2025-11-15
2025	13	Penn State	Nebraska	11/22/2025 TBD	2025-11-22
2025	13	Northwestern	Minnesota	11/22/2025 TBD	2025-11-22
2025	13	UCLA	Washington	11/22/2025 TBD	2025-11-22
2025	13	Oregon	USC	11/22/2025 TBD	2025-11-22
2025	13	Ohio State	Rutgers	11/22/2025 TBD	2025-11-22
2025	13	Iowa	Michigan State	11/22/2025 TBD	2025-11-22
2025	13	Maryland	Michigan	11/22/2025 TBD	2025-11-22
2025	13	Wisconsin	Illinois	11/22/2025 TBD	2025-11-22
2025	14	Nebraska	Iowa	11/28/2025 12:00 PM	2025-11-28 12:00:00
2025	14	Purdue	Indiana	11/28/2025 7:30 PM	2025-11-28 19:30:00
2025	14	Washington	Oregon	11/29/2025 TBD	2025-11-29
2025	14	Minnesota	Wisconsin	11/29/2025 TBD	2025-11-29
2025	14	USC	UCLA	11/29/2025 TBD	2025-11-29
2025	14	Rutgers	Penn State	11/29/2025 TBD	2025-11-29
2025	14	Illinois	Northwestern	11/29/2025 TBD	2025-11-29
2025	14	Michigan State	Maryland	11/29/2025 TBD	2025-11-29
2025	14	Michigan	Ohio State	11/29/2025 12:00 PM	2025-11-29 12:00:00
  `;

  // Process the raw data into a structured format
  const lines = gamesRawData.trim().split('\n').slice(1); // Skip header
  const gamesToInsert = lines.map(line => {
    const columns = line.split('\t');
    let gameTime = columns[5].trim();
    // Handle TBD times by setting them to midnight UTC on that day
    if (gameTime.length === 10) {
      gameTime += ' 00:00:00';
    }
    
    return {
      season: parseInt(columns[0].trim(), 10),
      week: parseInt(columns[1].trim(), 10),
      home_team: columns[2].trim(),
      away_team: columns[3].trim(),
      game_time: gameTime,
    };
  });

  console.log('Starting 2025 game schedule import process...');

  try {
    // 1. Clear any existing 2025 game data to ensure a clean import
    console.log('Deleting existing 2025 games...');
    const { error: deleteError } = await supabase.from('games').delete().eq('season', 2025);
    if (deleteError) throw deleteError;

    // 2. Insert the new game data
    console.log(`Inserting ${gamesToInsert.length} games for the 2025 season...`);
    const { error: insertError } = await supabase.from('games').insert(gamesToInsert);
    if (insertError) throw insertError;

    console.log('2025 game schedule imported successfully!');
    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Successfully imported ${gamesToInsert.length} games for the 2025 season.` }),
    };

  } catch (error) {
    console.error('An error occurred during the import process:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};